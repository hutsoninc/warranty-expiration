require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const { csvToJson } = require('@hutsoninc/utils');
const config = require('./config');
const { getDateString } = require('./helpers.js');
const scrape = require('./scrape.js');
const filter = require('./filter.js');
const db = require('./db.js');

module.exports = async function (options) {
    options = Object.assign({
        scrape: true
    }, config, options);

    let { Equipment, Report } = options.models;

    // Load Database
    await db.load().catch(err => {
        console.error(err);
        process.exit(1);
    });

    // Scrape data (downloads a csv of data)
    if (options.scrape) {
        console.log('Starting scrape...');
        await scrape(options);
    }

    // Fetch data from csv
    let filename =
        'warranty-expiration-' +
        getDateString({
            delimiter: '.',
            format: 'dd:mm:yyyy',
        }) +
        '.csv';

    let csvString = fs.readFileSync(
        path.join(options.downloadPath, filename),
        'utf8'
    );

    let data = await csvToJson(csvString);

    let dashboardReport = {
        timestamp: new Date(),
        equipmentAdded: 0,
        equipmentDiscarded: 0,
        equipmentMissing: 0,
        equipmentTotal: 0,
        missingEquipment: [],
    };

    console.log('Filtering ' + data.length + ' objects...');

    let promises = data.map(async obj => {
        return filter(obj, options).then(val => {
            dashboardReport.equipmentTotal++;

            if (val.model) {
                // found, add to database
                return { model: val.model, ...obj };
            }

            if (val.found && !val.kept) {
                // track number discarded
                dashboardReport.equipmentDiscarded++;
            } else {
                // track number missing and flag equipment serial number to be added to equipmentData
                dashboardReport.equipmentMissing++;
                dashboardReport.missingEquipment.push(obj.PIN);
            }

            return;
        });
    });

    data = await Promise.all(promises).filter(x => x);

    console.log(data.length + ' remaining after filtering...');

    promises = data.map(async obj => {
        return findEquipment(obj.PIN, Equipment).then(match => {
            if (match) {
                // this shouldn't happen unless report is ran for same month twice
                // console.log('Equipment already in database: ' + obj.PIN);
                return;
            }

            // Format Data
            obj.Account = obj.Account.match(/\d/g).join(''); // Remove escape characters from Account Number
            if (obj['Postal Code'].length > 5) {
                // If 9-digit postal code, add a hyphen
                obj['Postal Code'] =
                    obj['Postal Code'].substr(0, 5) +
                    '-' +
                    obj['Postal Code'].substr(5);
            }

            let dateArr = obj.Expires.split('.');
            let dateFormatted =
                dateArr[1] + '/' + dateArr[0] + '/' + dateArr[2];

            let entry = new Equipment({
                _id: obj.PIN,
                model: obj.model,
                account: obj.Account,
                name: obj['Customer Name'],
                street1: obj['Street 1'],
                street2: obj['Street 2'],
                postalCode: obj['Postal Code'],
                city: obj.City,
                region: obj.Region,
                country: obj.Country,
                warrantyType: obj['Warranty Type'],
                expirationDate: new Date(dateFormatted),
                postcardSent: false,
            });

            return saveDocument(entry).then(() => {
                // track number added
                dashboardReport.equipmentAdded++;
            });
        });
    });

    await Promise.all(promises).filter(x => x);

    console.log('Warranty System data saved to database');
    console.log(dashboardReport);

    let report = new Report(dashboardReport);

    await saveDocument(report);

    console.log('Finished!');
    process.exit(0);
};

function findEquipment(id, Equipment) {
    return new Promise(function (resolve, reject) {
        Equipment.findById(id, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}

function saveDocument(doc) {
    return new Promise(function (resolve, reject) {
        doc.save((err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}
