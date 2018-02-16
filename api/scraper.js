require('dotenv').config();
const puppeteer = require('puppeteer');
const helper = require('./helper.js');

var d = new Date();
var dM = d.getMonth() + 1;
var dD = d.getDate();
var dY = d.getFullYear();
var dateStart = dM + '/' + dD + '/' + dY;
var dateEnd = dM + 1 + '/' + dD + '/' + dY;

exports.scrape = async () => {
  
	const browser = await puppeteer.launch({headless: true});
	const page = await browser.newPage();

	await page.goto('https://warrantyreports.deere.com/reports/WarrantyReports.do');
	await page.type('#username', process.env.DEERE_USER);
	await page.type('[type="password"]', process.env.DEERE_PWD);
	await page.click('[name="login"]');

	await page.waitForSelector('.ent_leftnavmainlink');

	await page.addScriptTag({content: "leftNavSubmit('ExpiryReportPage')"});
	
	await page.waitForSelector('[value="034320"]');

	await page.click('[value="034320"]');

	await page.type('#dateStart', dateStart);
	await page.type('#dateEnd', dateEnd);
	
	page.on('dialog', async dialog => {
		await dialog.accept();
	});
	
	await page.click('#go');

	await helper.delay(10000);

	const result = await page.evaluate(() => {
		let data = [];
		let elements = document.querySelectorAll('#sortIt > tr');
		
		for (var element of elements){
			let pin = element.childNodes[3].childNodes[0].innerText
			let model = element.childNodes[5].innerText;
			let warrantyOption = element.childNodes[13].innerText;
			let expDate = element.childNodes[15].innerText;
			let expDaysLeft = element.childNodes[17].innerText;

			data.push({pin, model, warrantyOption, expDate, expDaysLeft});
		}

		return data;
	});

	browser.close();
	return result;

};