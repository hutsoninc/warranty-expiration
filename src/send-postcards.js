require('dotenv').config();
const fs = require('fs');
const Lob = require('lob')(process.env.LIVE_LOB_KEY);
const config = require('./config');

module.exports = function(options) {
    options = Object.assign({}, config, options);

    let { Equipment, SendReport } = options.models;

    let dashboardSendReport = {
        timestamp: new Date(),
        postcardsSent: 0,
        sendErrors: 0,
        unsent: [],
        totalEvaluated: 0,
    };

    let currentResult;
    let i = 0;

    Equipment.find({
        postcardSent: false,
        errorSending: { $exists: false },
    }).exec(function(err, result) {
        if (err) console.log(err);

        (function sendPostcard() {
            currentResult = result[i];

            setTimeout(function() {
                dashboardSendReport.totalEvaluated++;

                var expDateFormatted =
                    currentResult.expirationDate.getMonth() +
                    1 +
                    '/' +
                    currentResult.expirationDate.getDate() +
                    '/' +
                    currentResult.expirationDate.getFullYear();

                // Send postcard
                Lob.postcards.create(
                    {
                        description:
                            'Warranty Postcard Serial #' + currentResult._id,
                        to: {
                            name:
                                currentResult.name.length > 40
                                    ? 'Current Resident'
                                    : currentResult.name,
                            address_line1: currentResult.street1,
                            address_line2: currentResult.street2,
                            address_city: currentResult.city,
                            address_state: currentResult.region,
                            address_zip: currentResult.postalCode,
                        },
                        front: options.template.front,
                        back: options.template.back,
                        merge_variables: {
                            expDate: expDateFormatted,
                            model: currentResult.model,
                            serial: currentResult._id,
                        },
                    },
                    function(err, res) {
                        if (err) {
                            fs.appendFile(
                                './logs/sendErrors.log',
                                new Date().toLocaleString() +
                                    ' | (' +
                                    currentResult._id +
                                    ') ' +
                                    err +
                                    '\n',
                                err => {
                                    if (err) console.log(err);
                                }
                            );

                            Equipment.findById(currentResult._id, function(
                                err,
                                equipment
                            ) {
                                if (err) console.log(err);

                                equipment.set({ errorSending: true });

                                equipment.save(function(err) {
                                    if (err) console.log(err);
                                    increment();
                                });
                            });

                            dashboardSendReport.unsent.push(currentResult._id);
                            dashboardSendReport.sendErrors++;

                            console.log(
                                'Saved error log: ' +
                                    dashboardSendReport.sendErrors +
                                    ' - ' +
                                    currentResult._id
                            );
                        } else {
                            dashboardSendReport.postcardsSent++;

                            Equipment.findById(currentResult._id, function(
                                err,
                                equipment
                            ) {
                                if (err) console.log(err);

                                equipment.set({ postcardSent: true });

                                equipment.save(function(err) {
                                    if (err) console.log(err);
                                    increment();
                                });
                            });
                        }
                    }
                );

                function increment() {
                    i++;

                    if (i < result.length) {
                        sendPostcard();
                    } else {
                        // Create a report
                        var sendReport = new SendReport(dashboardSendReport);

                        sendReport.save(function(err) {
                            if (err) return console.error(err);
                            console.log('Report saved.');
                            process.exit();
                        });
                    }
                }
            }, 50);
        })();
    });
};
