require('dotenv').config();
var fs = require('fs');
var Lob = require('lob')(process.env.TEST_LOB_KEY);

// Models
var Equipment = require('./../models/Equipment.js');
var SendReport = require('./../models/SendReport.js');

// Source depends on where the send function is called
var templateFrontSrc = './app/templates/dist/warranty4x6Front.min.html';
var templateBackSrc = './app/templates/dist/warranty4x6Back.min.html';
var templateFront, templateBack;

exports.send = function(){

    var dashboardSendReport = {
        timestamp: new Date(),
        postcardsSent: 0,
        sendErrors: 0,
        totalEvaluated: 0
    };

    var currentResult;
    var i = 0;

    fs.readFile(templateFrontSrc, 'utf8', (err, data) => {
        templateFront = data;
    });

    fs.readFile(templateBackSrc, 'utf8', (err, data) => {
        templateBack = data;
    });
        
    Equipment.find({postcardSent: false}).exec(function(err, result){
        
        if(err) return console.error(err);

        (function sendPostcard(){

            currentResult = result[i];

            setTimeout(function(){
    
                dashboardSendReport.totalEvaluated++;

                // Send postcard
                Lob.postcards.create({
                    description: 'Warranty Postcard Serial #' + currentResult._id,
                    to: {
                        name: currentResult.name,
                        address_line1: currentResult.street1,
                        address_line2: currentResult.street2,
                        address_city: currentResult.city,
                        address_state: currentResult.region,
                        address_zip: currentResult.postalCode
                    },
                    front: templateFront,
                    back: templateBack,
                    merge_variables: {
                        expDate: currentResult.expirationDate,
                        model: currentResult.model,
                        serial: currentResult._id
                    }
                }, function (err, res){

                    if(err){

                        console.log(err);

                        dashboardSendReport.sendErrors++;

                    }else {

                        dashboardSendReport.postcardsSent++;

                        // Mark as sent
                        Equipment.update(
                            {_id: currentResult._id}, 
                            {postcardSent: true}, 
                            function(err){
                                if(err) return console.error(err);
                            }
                        );

                    }

                });
    
                i++;
                
                if(i < result.length){
                    sendPostcard();
                }
    
            }, 30)
    
        })();
        
    });
     
    setTimeout(function(){

        var sendReport = new SendReport({
            timestamp: dashboardSendReport.timestamp,
            postcardsSent: dashboardSendReport.postcardsSent,
            sendErrors: dashboardSendReport.sendErrors,
            totalEvaluated: dashboardSendReport.totalEvaluated
        });

        sendReport.save(function (err){
            if(err) return console.error(err);
            console.log('Report saved.')
        });

    }, 60000);

}