const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs-extra');
const { csvToJson } = require('@hutsoninc/utils');
const {
    scrubEmail,
    scrubState,
    scrubZip,
} = require('@hutsoninc/data-scrubber');
const {
    getMonthName,
    isDefined,
    isEmptyString,
    toListString,
    xlsxToJson,
} = require('./src/utils');
const fetchHutsonLocations = require('./src/fetch-hutson-locations');
const Lob = require('lob')(process.env.TEST_LOB_KEY);
const Bottleneck = require('bottleneck');

const lobLimiter = new Bottleneck({
    maxConcurrent: 50,
    minTime: 5000 / 150,
});

const uploadsPath = path.join(__dirname, 'uploads');
const exportsPath = path.join(__dirname, 'exports');

const equipmentLookupFileName = 'equipment.csv';
const equipmentLookupFilePath = path.join(
    __dirname,
    `src/data/${equipmentLookupFileName}`
);

const agCceLetterTemplatePath = path.join(
    __dirname,
    'src/templates/dist/ag-cce-warranty-letter.min.html'
);

const xlsxProperties = ['PIN-17', 'Customer Email Address'];

const csvProperties = [
    'PIN',
    'Customer Name',
    'Street 1',
    'Street 2',
    'Postal Code',
    'City',
    'Region',
    'Country',
    'Expires',
];

const validateProperties = (data, propertiesArr, { fileName }) => {
    const props = [];
    data.forEach((obj) => {
        const keys = Object.keys(obj);
        keys.forEach((key) => {
            if (!props.includes(key)) {
                props.push(key);
            }
        });
    });
    propertiesArr.forEach((prop) => {
        if (!props.includes(prop)) {
            throw new Error(
                `Property ${prop} could not be found in file ${fileName}`
            );
        }
    });
};

const main = async () => {
    const helpers = {
        lobLimiter,
        Lob,
    };

    const dateString = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const timestamp = Date.now();
    const hutsonLocations = await fetchHutsonLocations(helpers);

    // Get equipment lookup data
    const equipmentLookupFileContents = fs.readFileSync(
        equipmentLookupFilePath,
        'utf-8'
    );
    const equipmentLookup = await csvToJson(equipmentLookupFileContents);

    // Get templates
    const agCceLetterTemplate = fs.readFileSync(
        agCceLetterTemplatePath,
        'utf-8'
    );

    // Get upload files
    const uploadFiles = await fs.readdir(uploadsPath);

    // Move CSV file to top - this file contains the initial data
    uploadFiles.sort((a, b) => {
        const { ext: aExt } = path.parse(a);
        const { ext: bExt } = path.parse(b);
        if (aExt > bExt) {
            return 1;
        } else if (aExt < bExt) {
            return -1;
        }
        return 0;
    });

    const spreadsheetFiles = uploadFiles.filter((fileName) => {
        const { ext } = path.parse(fileName);
        return ['.csv', '.xlsx'].includes(ext);
    });

    console.log(`Parsing uploaded files...`);

    const spreadsheetFilesJson = await Promise.all(
        spreadsheetFiles
            .map((fileName) => {
                const { ext } = path.parse(fileName);

                const filePath = path.join(uploadsPath, fileName);

                switch (ext) {
                    case '.xlsx':
                        return xlsxToJson(filePath).then((data) => {
                            // Validate properties
                            validateProperties(data, xlsxProperties, {
                                fileName,
                            });
                            return { fileName, ext, data };
                        });
                    case '.csv':
                        const fileContents = fs.readFileSync(filePath, 'utf-8');
                        return csvToJson(fileContents).then((data) => {
                            // Validate properties
                            validateProperties(data, csvProperties, {
                                fileName,
                            });
                            return { fileName, ext, data };
                        });
                    default:
                        return null;
                }
            })
            .filter(isDefined)
    );

    if (spreadsheetFilesJson[0].ext !== '.csv') {
        throw new Error(
            `Missing .csv file from jdwarrantysystem.deere.com. Please add the file to ${uploadsPath} and try again.`
        );
    }

    const combinedData = spreadsheetFilesJson.reduce((acc, dataset) => {
        dataset.data.forEach((machine) => {
            const matchIndex = acc.data.findIndex(
                (obj) => obj.PIN === machine['PIN-17']
            );
            if (matchIndex !== -1) {
                acc.data[matchIndex].Email = machine['Customer Email Address'];
                acc.data[matchIndex]['PowerGard Eligible'] = true;
            }
        });
        return acc;
    });

    console.log(
        `Found ${combinedData.data.length} records. Cleaning up and filtering data...`
    );

    // Clean up data and get model name from equipment lookup table
    const missingPins = [];

    const data = combinedData.data
        .map((obj) => {
            const pin = obj.PIN;
            const street1 = obj['Street 1'];
            const postalCode = scrubZip(obj['Postal Code'].slice(0, 5));
            const city = obj.City;
            const name = obj['Customer Name'].trim();
            const hutsonDealerNumber = obj.Account.trim();

            const match = equipmentLookup.find(
                (row) => pin.indexOf(row.id) === 0
            );
            if (!match) {
                missingPins.push(pin);
                return;
            }
            if (
                match.keep === 'FALSE' ||
                !match.keep ||
                isEmptyString(street1) ||
                isEmptyString(postalCode) ||
                isEmptyString(city)
            ) {
                return;
            }
            const hutsonLocationDetails = hutsonLocations.find((loc) => {
                return [
                    loc.agDealerId,
                    loc.turfDealerId,
                    loc.cceDealerId,
                ].includes(hutsonDealerNumber);
            });
            if (!hutsonLocationDetails) {
                console.log(
                    `No Hutson location found with dealer id #${hutsonDealerNumber}`
                );
                return;
            }
            const [expD, expM, expY] = obj.Expires.split('.');
            const expirationDate = `${getMonthName(expM)} ${expD}, ${expY}`;

            return {
                pin,
                hutsonDealerNumber,
                hutsonLocationDetails,
                model: match.model,
                category: match.category,
                name: isEmptyString(name) ? 'Current Resident' : name,
                email: scrubEmail(obj.Email),
                street1,
                street2: obj['Street 2'],
                city,
                state: scrubState(obj.Region),
                postalCode,
                expirationDate,
                pgEligible: obj['PowerGard Eligible'] ? true : false,
            };
        })
        .filter(isDefined);

    if (missingPins.length > 0) {
        throw new Error(
            `No match found in ${equipmentLookupFileName} for pin #${
                missingPins.length > 1 ? "'s" : ''
            }:\n${missingPins.join('\n')}`
        );
    }

    console.log(`${data.length} records remaining after filtering.`);

    console.log('Sending letters and postcards...');

    // Get list of ag and cce - combine if address is the same
    const agCceList = data.reduce((acc, obj) => {
        if (['ag', 'cce'].includes(obj.category)) {
            const matchIndex = acc.findIndex(
                (i) =>
                    `${i.street1}-${i.postalCode}` ===
                    `${obj.street1}-${obj.postalCode}`
            );
            const { category, model, pin, expirationDate, ...rest } = obj;
            const modelDetails = {
                category,
                model,
                pin,
                expirationDate,
            };
            if (matchIndex === -1) {
                acc.push({
                    ...rest,
                    models: [modelDetails],
                });
            } else {
                acc[matchIndex].models.push(modelDetails);
            }
        }
        return acc;
    }, []);

    const agCceLetterResults = {
        errorCount: 0,
        successCount: 0,
        total: agCceList.length,
    };

    await Promise.all(
        [agCceList[0]].map((obj) => {
            return new Promise((resolve, reject) => {
                lobLimiter.schedule(() => {
                    Lob.letters.create(
                        {
                            to: {
                                name: obj.name,
                                address_line1: obj.street1,
                                address_line2: obj.street2,
                                address_city: obj.city,
                                address_state: obj.state,
                                address_zip: obj.postalCode,
                            },
                            from: obj.hutsonLocationDetails.lobAddressId,
                            file: agCceLetterTemplate,
                            merge_variables: {
                                hutsonAddressLine1:
                                    obj.hutsonLocationDetails.address,
                                name: obj.name,
                                addressLine1: obj.street1,
                                addressLine2: obj.street2,
                                equipmentList: obj.models
                                    .map((model) => {
                                        return `<li>${model.model} (#${model.pin}) expires ${model.expirationDate}</li>`;
                                    })
                                    .join(''),
                                hutsonPhoneNumber:
                                    obj.hutsonLocationDetails.phoneNumber,
                                date: dateString,
                            },
                            color: true,
                            address_placement: 'insert_blank_page',
                        },
                        (err, res) => {
                            if (err) {
                                console.error(
                                    `Failed to sent letter for PIN #${obj.pin}: `,
                                    err
                                );
                                agCceLetterResults.errorCount += 1;
                            } else {
                                agCceLetterResults.successCount += 1;
                            }
                            resolve(res);
                        }
                    );
                });
            });
        })
    );

    console.log(
        `Successfully sent ${agCceLetterResults.successCount}/${agCceLetterResults.total} Ag & CCE Letters`
    );

    // Get list of PG eligible turf - combine them
    const powergardList = data.filter((obj) => {
        return obj.pgEligible;
    });

    // Get list of non-eligible turf - combine them
    const turfNonPowergardList = data.filter((obj) => {
        return obj.category === 'turf' && !obj.pgEligible;
    });

    console.log({
        agCceList: agCceList.length,
        powergardList: powergardList.length,
        turfNonPowergardList: turfNonPowergardList.length,
    });

    console.log('Creating email lists...');

    // Create lists
    // PowerGard email list
    const powerGardEmailList = powergardList
        .reduce((acc, obj) => {
            if (isDefined(obj.email) && !isEmptyString(obj.email)) {
                const matchIndex = acc.findIndex((i) => i.email === obj.email);
                if (matchIndex === -1) {
                    acc.push({
                        email: obj.email,
                        warranty_expiration_details: [
                            `${obj.model} (#${obj.pin}) expires ${obj.expirationDate}`,
                        ],
                        warranty_expiration_model: [obj.model],
                    });
                } else {
                    acc[matchIndex].warranty_expiration_details.push(
                        `${obj.model} (#${obj.pin}) expires ${obj.expirationDate}`
                    );
                    acc[matchIndex].warranty_expiration_model.push(obj.model);
                }
            }
            return acc;
        }, [])
        .map((obj) => {
            return {
                email: obj.email,
                warranty_expiration_details: toListString(
                    obj.warranty_expiration_details,
                    { delimiter: ';' }
                ),
                warranty_expiration_model: toListString(
                    obj.warranty_expiration_model
                ),
            };
        });

    fs.writeFileSync(
        path.join(exportsPath, `powergard-email-list-${timestamp}.json`),
        JSON.stringify(powerGardEmailList, null, 4)
    );
};

main().catch((err) => {
    console.error(err);
});
