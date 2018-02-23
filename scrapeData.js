require('dotenv').config();
var _ = require('lodash/core');
const fs = require('fs');
const csv = require('csvtojson');
const helper = require('./app/api/helper.js');
const scraper = require('./app/api/scraper.js');
const filter = require('./app/api/filter.js');
const app = require('./app.js');

const DOWNLOADS_PATH = '../../Downloads/';

// Models
var Equipment = require('./app/models/equipment.js');

app.load().then(() => {
    /*
    scraper.scrape().then(() => {
    */
        var dashboardReport = {
            timestamp: new Date(),
            equipmentAdded: 0,
            equipmentDiscarded: 0,
            equipmentMissing: 0,
            equipmentTotal: 0,
            missingEquipment: []
        };
        
        csv({
            noheader: false,
            headers: ['PIN', 'Account', 'Dealer', 'Customer Name', 'Phone', 'Street 1', 'Street 2', 'Postal Code', 'City', 'Region', 'Country', 'Expires', 'Warranty Type']
        })
        .fromFile(DOWNLOADS_PATH + 'warranty-expiration-' + helper.getDateString({delimiter: '.', format: 'dd:mm:yyyy'}) + '.csv')
        .on('json', (jsonObj) => {

            var equipmentReport = filter.run(jsonObj).then((equipmentReport) => {

                dashboardReport.equipmentTotal++;

                if(equipmentReport.model){

                    // found, add to database
                    Equipment.findById(jsonObj.PIN, function(err, result){
        
                        if(err) return console.error(err);
            
                        // Format Data
                        jsonObj.Account = jsonObj.Account.match(/\d/g).join(''); // Remove escape characters from Account Number
                        if(jsonObj['Postal Code'].length > 5){ // If 9-digit postal code, add a hyphen
                            jsonObj['Postal Code'] = jsonObj['Postal Code'].substr(0, 5) + '-' + jsonObj['Postal Code'].substr(5);
                        }
            
                        var dateArr = jsonObj.Expires.split('.');
                        var dateFormatted = dateArr[1] + "/" + dateArr[0] + "/" +  dateArr[2];
            
                        if(!result){
            
                            var entry = new Equipment({
                                _id: jsonObj.PIN,
                                model: equipmentReport.model,
                                account: jsonObj.Account,
                                name: jsonObj['Customer Name'],
                                street1: jsonObj['Street 1'],
                                street2: jsonObj['Street 2'],
                                postalCode: jsonObj['Postal Code'],
                                city: jsonObj.City,
                                region: jsonObj.Region,
                                country: jsonObj.Country,
                                warrantyType: jsonObj['Warranty Type'],
                                expirationDate: dateFormatted,
                                postcardSent: false
                            });
                    
                            entry.save(function (err){
                                if(err) return console.error(err);

                                // track number added
                                dashboardReport.equipmentAdded++;
                            });
            
                        }else {

                            // this shouldn't happen unless report is ran for same month twice
                            //console.log('Equipment already in database: ' + jsonObj.PIN);
            
                        }
            
                    });
                    
                }else if(equipmentReport.found && !equipmentReport.kept){

                    // track number discarded
                    dashboardReport.equipmentDiscarded++;

                }else {

                    // track number missing and flag equipment serial number to be added to equipmentData
                    dashboardReport.equipmentMissing++;
                    dashboardReport.missingEquipment.push(jsonObj.PIN);

                }
            
            }, (err) => {

                if(err) return console.error(err);

            });
    
        })
        .on('done', (error) => {
    
            console.log('Warranty System data saved to database');

            // need to improve how this is done...
            setTimeout(function(){
                console.log(dashboardReport);
                process.exit(0);
            }, 10000);
    
        });
    /*
    });
*/
}, (err) => {

    console.log(err);

});