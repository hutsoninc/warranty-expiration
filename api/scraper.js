require('dotenv').config();
const puppeteer = require('puppeteer');
const helper = require('./helper.js');

exports.scrape = async function(){
  
	const browser = await puppeteer.launch({headless: true});
	var page = await browser.newPage();

	// Scrape Warranty Reports Data
	await page.goto('https://warrantyreports.deere.com/reports/WarrantyReports.do');
	await page.type('#username', process.env.DEERE_USER);
	await page.type('[type="password"]', process.env.DEERE_PWD);
	await page.click('[name="login"]');

	await page.waitForSelector('.ent_leftnavmainlink');
	await page.addScriptTag({content: "leftNavSubmit('ExpiryReportPage')"});

	//await page.goto('https://warrantyreports.deere.com/reports/WarrantyReports.do');
	
	await page.waitForSelector('[value="034320"]');
	await page.click('[value="034320"]');
	
	await page.waitForSelector('#dateStart');
	await page.type('#dateStart', helper.getDateString({distance: 30}));
	await page.type('#dateEnd', helper.getDateString({distance: 90}));
	
	page.on('dialog', async dialog => {
		await dialog.accept();
	});

	await page.waitForSelector('#go');
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

	// Fetch Warranty System Data
	// await page.goto('https://jdwarrantysystem.deere.com/portal/');
	// await page.type('#username', process.env.DEERE_USER);
	// await page.type('[type="password"]', process.env.DEERE_PWD);
	// await page.click('[name="login"]');

	await page.goto('https://jdwarrantysystem.deere.com/portal/#/products/warranty-expiration?_k=jyedxr');

	await page.waitForSelector('[title="Basic Warranty"');
	await page.click('[title="Basic Warranty"]');

	await page.type('div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > input', helper.getDateString({distance: 30, delimiter: '.', format: 'dd:mm:yyyy'}));
	await page.keyboard.press('Tab');
	await page.type('div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(3) > div > input', helper.getDateString({distance: 90, delimiter: '.', format: 'dd:mm:yyyy'}));
	await page.keyboard.press('Tab');
	
	await page.click('div.warranty-expiration-report-criteria.report-criteria > section > div.button-group > button.primary-button');

	await helper.delay(75000);

	await page.waitForSelector('div.export-excel > a.download-to-excel');

	await page.click('div.export-excel > a.download-to-excel');

	await helper.delay(10000);

	browser.close();
	return result;

};