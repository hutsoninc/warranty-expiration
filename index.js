const fs = require('fs');
const scraper = require('./api/scraper.js');

scraper.scrape().then((value) => {
	fs.writeFile('./data/data.json', JSON.stringify(value));
	console.log('data saved');
});