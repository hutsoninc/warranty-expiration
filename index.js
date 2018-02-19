require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csvtojson');
const helper = require('./api/helper.js');
const scraper = require('./api/scraper.js');

// Set up default mongoose connection
var mongoDB = process.env.MONGODB_URL;
mongoose.connect(mongoDB);
// Get the default connection
db = mongoose.connection;

// Bind connection to error event
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

scraper.scrape().then((result) => {

	var systemResult = [];

	fs.writeFile('./data/data.json', JSON.stringify(result), (err) => {
		if (err) throw err;
		console.log('Warranty Expiration data saved');
	});

	csv({
		noheader: false,
		headers: ['PIN', 'Account', 'Dealer', 'Customer Name', 'Phone', 'Street 1', 'Street 2', 'Postal Code', 'City', 'Region', 'Country', 'Expires', 'Warranty Type']
	})
	.fromFile(process.env.DOWNLOADS_PATH + 'warranty-expiration-' + helper.getDateString({delimiter: '.', format: 'dd:mm:yyyy'}) + '.csv')
	.on('json', (jsonObj) => {
		systemResult.push(jsonObj);
	})
	.on('done', (error) => {
		console.log('csv converted');
		fs.writeFile('./data/systemData.json', JSON.stringify(systemResult), (err) => {
			if (err) throw err;
			console.log('Warranty System data saved');
			process.exit();
		});
	});

});