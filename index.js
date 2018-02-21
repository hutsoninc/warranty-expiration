require('dotenv').config();
const fs = require('fs');
const csv = require('csvtojson');
const mongoose = require('mongoose');
const helper = require('./app/api/helper.js');
const scraper = require('./app/api/scraper.js');

// Load models
var Equipment = require('./app/models/equipment.js');

// Set up default mongoose connection
var mongoDB = process.env.MONGODB_URL;
mongoose.connect(mongoDB);
// Get the default connection
db = mongoose.connection;

// Bind connection to error event
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

scraper.scrape().then((result) => {

	var systemResult = [];
	
	csv({
		noheader: false,
		headers: ['PIN', 'Account', 'Dealer', 'Customer Name', 'Phone', 'Street 1', 'Street 2', 'Postal Code', 'City', 'Region', 'Country', 'Expires', 'Warranty Type']
	})
	.fromFile(process.env.DOWNLOADS_PATH + 'warranty-expiration-' + helper.getDateString({delimiter: '.', format: 'dd:mm:yyyy'}) + '.csv')
	.on('json', (jsonObj) => {

		// MongoDB
		Equipment.findById(jsonObj.PIN, function(err, result){

			if(err) return console.error(err);

			// =============================================================================
			// ===   First test serial number to see if it's equipment we want to keep   ===
			// =============================================================================

			// Format Data
			jsonObj.Account = jsonObj.Account.match(/\d/g).join(''); // Remove escape characters from Account Number
			if(jsonObj['Postal Code'].length > 5){ // If 9-digit postal code, add a hyphen
				jsonObj['Postal Code'] = jsonObj['Postal Code'].substr(0,5) + '-' + jsonObj['Postal Code'].substr(5);
			}

			var dateArr = jsonObj.Expires.split('.');
			var dateFormatted = dateArr[1] + "/" + dateArr[0] + "/" +  dateArr[2];

			if(!result){

				var entry = new Equipment({
					_id: jsonObj.PIN,
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
				});

			}else {
				
				result.account = jsonObj.Account;
				result.name = jsonObj['Customer Name'];
				result.street1 = jsonObj['Street 1'];
				result.street2 = jsonObj['Street 2'];
				result.postalCode = jsonObj['Postal Code'];
				result.city = jsonObj.City;
				result.region = jsonObj.Region;
				result.country = jsonObj.Country;
				result.warrantyType = jsonObj['Warranty Type'];
				result.expirationDate = dateFormatted;
		
				result.save(function (err){
					if(err) return console.error(err);
				});

			}

		});
		
		systemResult.push(jsonObj);

	})
	.on('done', (error) => {

		console.log('Warranty System data saved to database');

		fs.writeFile('./data/systemData.json', JSON.stringify(systemResult), (err) => {
			if (err) throw err;
			console.log('Warranty System data saved to local file');
		});

	});

	result.forEach(function(elem, index){

		Equipment.update(
			{_id: elem.pin}, 
			{model: elem.model}, 
			function(err){
				if(err) return console.error(err);
			}
		);

	});

	fs.writeFile('./data/data.json', JSON.stringify(result), (err) => {
		if (err) throw err;
		console.log('Warranty Expiration data saved');
	});

});