require('dotenv').config();
var fs = require('fs');
var Lob = require('lob')(process.env.TEST_LOB_KEY);
var Equipment = require('./../models/Equipment.js');

// Models
var SendReport = require('../models/SendReport.js');

var dashboardSendReport = {
    timestamp: new Date(),
    postcardsSent: 0,
    sendErrors: 0,
    totalEvaluated: 0
};

// Source depends on where the send function is called
var templateFrontSrc = './app/templates/dist/warranty4x6Front.min.html';
var templateBackSrc = './app/templates/dist/warranty4x6Back.min.html';
var templateFront, templateBack;

exports.send = function(){

    fs.readFile(templateFrontSrc, 'utf8', (err, data) => {
        templateFront = data;
    });

    fs.readFile(templateBackSrc, 'utf8', (err, data) => {
        templateBack = data;
    });

    setTimeout(function(){
        
        Equipment.find({postcardSent: false}).exec(function(err, result){
            
            if(err) return console.error(err);

            result.forEach(function(e, i){

                // var e = {
                //     _id: '1M0X300CAEM284382',
                //     model: '1025R',
                //     name: 'AUSTIN GORDON',
                //     street1: '306 ANDRUS DRIVE',
                //     street2: '',
                //     postalCode: '42071',
                //     city: 'MURRAY',
                //     region: 'KY',
                //     country: 'US',
                //     warrantyType: 'B-Basic Warranty',
                //     expirationDate: '04/21/2018',
                //     postcardSent: false
                // }

                dashboardSendReport.totalEvaluated++;

                // Send postcard
                Lob.postcards.create({
                    description: 'Warranty Postcard Serial #' + e._id,
                    to: {
                        name: e.name,
                        address_line1: e.street1,
                        address_line2: e.street2,
                        address_city: e.city,
                        address_state: e.region,
                        address_zip: e.postalCode
                    },
                    front: templateFront,
                    back: templateBack,
                    merge_variables: {
                        expDate: e.expirationDate,
                        model: e.model,
                        serial: e._id
                    }
                }, function (err, res){

                    if(err){

                        console.log(err);

                        dashboardSendReport.sendErrors++;

                    }else {

                        dashboardSendReport.postcardsSent++;

                        // Mark as sent
                        Equipment.update(
                            {_id: e._id}, 
                            {postcardSent: true}, 
                            function(err){
                                if(err) return console.error(err);
                            }
                        );

                    }

                });

                
            
            });
            
        });

        var sendReport = new SendReport({
            timestamp: dashboardSendReport.timestamp,
            postcardsSent: dashboardSendReport.postcardsSent,
            errors: dashboardSendReport.sendErrors,
            totalEvaluated: dashboardSendReport.totalEvaluated
        });

        sendReport.save(function (err){
            if(err) return console.error(err);
            console.log('Report saved.')
        });

    }, 3000);

}