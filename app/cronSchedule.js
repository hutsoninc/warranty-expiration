var cron = require('cron');
var scrapeData = require('./../scrapeData');

exports.init = function(){

    // Set to run first day of each month at 6:45
    var scrapeJob = new cron.CronJob({
        cronTime: '0 44 5 1 * *',
        onTick: function() {
            scrapeData.run
            console.log('Scrape job triggered');
        },
        start: false,
        timeZone: 'America/Chicago'
    });
    
    scrapeJob.start();
    
    console.log('Scrape job scheduled');

}