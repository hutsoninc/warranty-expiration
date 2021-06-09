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
    maxConcurrent: 25,
    minTime: 5000 / 125, // Max is 150 per 5 seconds
});

const uploadsPath = path.join(__dirname, 'uploads');
const uploadsCompletedPath = path.join(__dirname, 'uploads/completed');
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

const turfPowergardPostcardTemplateFrontPath = path.join(
    __dirname,
    'src/templates/dist/turf-powergard-postcard-front.min.html'
);

const turfPowergardPostcardTemplateBackPath = path.join(
    __dirname,
    'src/templates/dist/turf-powergard-postcard-back.min.html'
);

const turfGenericPostcardTemplateFrontPath = path.join(
    __dirname,
    'src/templates/dist/turf-generic-postcard-front.min.html'
);

const turfGenericPostcardTemplateBackPath = path.join(
    __dirname,
    'src/templates/dist/turf-generic-postcard-back.min.html'
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

const conditionalCreateList = (data, test) => {
    return data.reduce((acc, obj) => {
        if (test(obj)) {
            const { category, model, pin, expirationDate, ...rest } = obj;
            const modelDetails = {
                category,
                model,
                pin,
                expirationDate,
            };
            // Check if customer is already in the list
            const matchIndex = acc.findIndex(
                (i) =>
                    `${i.street1}-${i.postalCode}` ===
                    `${obj.street1}-${obj.postalCode}`
            );
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

    const turfPowergardPostcardTemplateFront = fs.readFileSync(
        turfPowergardPostcardTemplateFrontPath,
        'utf-8'
    );

    const turfPowergardPostcardTemplateBack = fs.readFileSync(
        turfPowergardPostcardTemplateBackPath,
        'utf-8'
    );

    const turfGenericPostcardTemplateFront = fs.readFileSync(
        turfGenericPostcardTemplateFrontPath,
        'utf-8'
    );

    const turfGenericPostcardTemplateBack = fs.readFileSync(
        turfGenericPostcardTemplateBackPath,
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
                name:
                    isEmptyString(name) || name.length > 40
                        ? 'Current Resident'
                        : name,
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

    // Ag and CCE equipment
    const agCceList = conditionalCreateList(data, (obj) => {
        return ['ag', 'cce'].includes(obj.category);
    });

    const agCceLetterResults = {
        errorCount: 0,
        successCount: 0,
        total: 0,
    };

    await Promise.all(
        agCceList.map((obj) => {
            return new Promise((resolve) => {
                if (obj.models.length > 20) {
                    // This shouldn't ever happen, but will keep anything unexpected from happening
                    resolve();
                }
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
                                hutsonAddressLine2: `${obj.hutsonLocationDetails.city}, ${obj.hutsonLocationDetails.state} ${obj.hutsonLocationDetails.zip}`,
                                name: obj.name,
                                addressLine1: [obj.street1, obj.street2]
                                    .filter(
                                        (val) =>
                                            !isEmptyString(val) &&
                                            isDefined(val)
                                    )
                                    .join(', '),
                                addressLine2: `${obj.city}, ${obj.state} ${obj.postalCode}`,
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
                        (err) => {
                            agCceLetterResults.total += 1;
                            if (err) {
                                console.error(
                                    `Failed to sent letter to ${obj.name} at ${obj.street1}, ${obj.city}, ${obj.state} ${obj.postalCode}\n`,
                                    err
                                );
                                agCceLetterResults.errorCount += 1;
                            } else {
                                agCceLetterResults.successCount += 1;
                            }
                            resolve();
                        }
                    );
                });
            });
        })
    );

    console.log(
        `Successfully sent ${agCceLetterResults.successCount}/${agCceLetterResults.total} Ag & CCE letters`
    );

    // PowerGard eligible turf equipment
    const turfPowergardList = conditionalCreateList(data, (obj) => {
        return obj.pgEligible;
    });

    const turfPowergardPostcardResults = {
        errorCount: 0,
        successCount: 0,
        total: 0,
    };

    await Promise.all(
        turfPowergardList.map((obj) => {
            return new Promise((resolve) => {
                if (obj.models.length > 3) {
                    // This shouldn't happen very often, but will keep us from flooding their mailbox
                    resolve();
                }
                Promise.all(
                    obj.models.map(({ model, pin, expirationDate }) => {
                        return new Promise((res) => {
                            lobLimiter.schedule(() => {
                                Lob.postcards.create(
                                    {
                                        to: {
                                            name: obj.name,
                                            address_line1: obj.street1,
                                            address_line2: obj.street2,
                                            address_city: obj.city,
                                            address_state: obj.state,
                                            address_zip: obj.postalCode,
                                        },
                                        from: obj.hutsonLocationDetails
                                            .lobAddressId,
                                        front: turfPowergardPostcardTemplateFront,
                                        back: turfPowergardPostcardTemplateBack,
                                        merge_variables: {
                                            model,
                                            pin,
                                            expirationDate,
                                        },
                                        size: '4x6',
                                    },
                                    (err) => {
                                        turfPowergardPostcardResults.total += 1;
                                        if (err) {
                                            console.error(
                                                `Failed to sent postcard to ${obj.name} at ${obj.street1}, ${obj.city}, ${obj.state} ${obj.postalCode}\n`,
                                                err
                                            );
                                            turfPowergardPostcardResults.errorCount += 1;
                                        } else {
                                            turfPowergardPostcardResults.successCount += 1;
                                        }
                                        res();
                                    }
                                );
                            });
                        });
                    })
                ).then(() => {
                    resolve();
                });
            });
        })
    );

    console.log(
        `Successfully sent ${turfPowergardPostcardResults.successCount}/${turfPowergardPostcardResults.total} Turf PowerGard postcards`
    );

    // Other turf equipment
    const turfGenericList = conditionalCreateList(data, (obj) => {
        return obj.category === 'turf' && !obj.pgEligible;
    });

    const turfGenericPostcardResults = {
        errorCount: 0,
        successCount: 0,
        total: 0,
    };

    await Promise.all(
        turfGenericList.map((obj) => {
            return new Promise((resolve) => {
                if (obj.models.length > 3) {
                    // This shouldn't happen very often, but will keep us from flooding their mailbox
                    resolve();
                }
                Promise.all(
                    obj.models.map(({ model, pin, expirationDate }) => {
                        return new Promise((res) => {
                            lobLimiter.schedule(() => {
                                Lob.postcards.create(
                                    {
                                        to: {
                                            name: obj.name,
                                            address_line1: obj.street1,
                                            address_line2: obj.street2,
                                            address_city: obj.city,
                                            address_state: obj.state,
                                            address_zip: obj.postalCode,
                                        },
                                        from: obj.hutsonLocationDetails
                                            .lobAddressId,
                                        front: turfGenericPostcardTemplateFront,
                                        back: turfGenericPostcardTemplateBack,
                                        merge_variables: {
                                            model,
                                            pin,
                                            expirationDate,
                                        },
                                        size: '4x6',
                                    },
                                    (err) => {
                                        turfGenericPostcardResults.total += 1;
                                        if (err) {
                                            console.error(
                                                `Failed to sent postcard to ${obj.name} at ${obj.street1}, ${obj.city}, ${obj.state} ${obj.postalCode}\n`,
                                                err
                                            );
                                            turfGenericPostcardResults.errorCount += 1;
                                        } else {
                                            turfGenericPostcardResults.successCount += 1;
                                        }
                                        res();
                                    }
                                );
                            });
                        });
                    })
                ).then(() => {
                    resolve();
                });
            });
        })
    );

    console.log(
        `Successfully sent ${turfGenericPostcardResults.successCount}/${turfGenericPostcardResults.total} Turf Generic postcards`
    );

    console.log({
        agCceList: agCceList.length,
        turfPowergardList: turfPowergardList.length,
        turfGenericList: turfGenericList.length,
    });

    console.log('Creating email lists...');

    // PowerGard email list
    const powerGardEmailList = data
        .reduce((acc, obj) => {
            if (
                obj.pgEligible &&
                isDefined(obj.email) &&
                !isEmptyString(obj.email)
            ) {
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

    await Promise.all(
        spreadsheetFiles.map((fileName) => {
            return fs.move(
                path.join(uploadsPath, fileName),
                path.join(uploadsCompletedPath, fileName)
            );
        })
    );
};

main().catch((err) => {
    console.error(err);
});
