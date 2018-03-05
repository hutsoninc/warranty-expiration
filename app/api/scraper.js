require('dotenv').config();
const puppeteer = require('puppeteer');
const helper = require('./helper.js');

exports.scrape = async function(){

	var config = {
		month: 5, // 1-12
		year: 2018
	}

	config.endDay = helper.daysInMonth(config.month, 2018);

	var returnError;
	
	const browser = await puppeteer.launch({headless: true});
	var page = await browser.newPage();

	try{

		if(process.env.NODE_ENV == "production"){
			await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: './downloads'});		
		}

		await page.goto('https://dealerpath.deere.com/');

		await page.waitForSelector('#username');
		await page.type('#username', process.env.DEERE_USER);
		await page.type('[type="password"]', process.env.DEERE_PWD);
		await helper.delay(1000);
		await page.click('[name="login"]');

		await helper.delay(5000);

		await page.evaluate(() => {

			var loginTitle = document.querySelector('.login-title');

			if(loginTitle){

				if(loginTitle.innerText == 'Reset Password'){

					throw new Error('Password Expired');

				}

			}

			return;

		});
	
		/*
		// Scrape Warranty Reports Data
		await page.goto('https://warrantyreports.deere.com/reports/WarrantyReports.do');
		await page.type('#username', process.env.DEERE_USER);
		await page.type('[type="password"]', process.env.DEERE_PWD);
		await page.click('[name="login"]');

		await page.waitForSelector('.ent_leftnavmainlink');
		await page.addScriptTag({content: "leftNavSubmit('ExpiryReportPage');"});
			
		await page.waitForSelector('#dealerPerson');
		await page.click('#dealerPerson option:nth-of-type(2)');
		await page.keyboard.down('Shift');
		await page.click('#dealerPerson option:last-of-type');
		await page.keyboard.up('Shift');
		
		await page.waitForSelector('#dateStart');
		await page.addScriptTag({content: "document.querySelector('#dateStart').setAttribute('value', '" + helper.getDateString({day: 1, month: config.month, year: config.year}) + "');"});
		await page.addScriptTag({content: "document.querySelector('#dateEnd').setAttribute('value', '" + helper.getDateString({day: config.endDay, month: config.month, year: config.year}) + "');"});

		await helper.delay(7500);
		
		page.on('dialog', async dialog => {
			await dialog.accept();
		});
		
		await page.waitForSelector('#go');
		await page.click('#go');
		
		await page.waitForSelector('[name="searchLimit"]');
		await page.addScriptTag({content: "document.querySelector('select[name=\"searchLimit\"] > option[value=\"2000\"]').setAttribute(\"selected\",\"selected\")"});

		await page.click('input[value="Search"]');

		await helper.delay(15000);

		const result = await page.evaluate(() => {
			let data = [];
			let elements = document.querySelectorAll('#sortIt > tr');
			
			elements.forEach(function(element, index){
				let pin = element.childNodes[3].childNodes[0].innerText;
				let model = element.childNodes[5].innerText;
				let expDaysLeft = element.querySelector('td:last-of-type').innerText;

				data.push({pin, model, expDaysLeft});
			});

			return data;
		});
		*/

		// Download Warranty System Data
		await page.goto('https://jdwarrantysystem.deere.com/portal/#/products/warranty-expiration?_k=jyedxr');

		await page.waitForSelector('[title="Basic Warranty"');
		await page.waitForSelector('div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > div.react-datepicker-wrapper > div > input');
		
		await page.click('[title="Basic Warranty"]');

		await page.type('div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > div.react-datepicker-wrapper > div > input', helper.getDateString({day: 1, month: config.month, year: config.year, delimiter: '.', format: 'dd:mm:yyyy'}));
		await page.keyboard.press('Tab');
		await page.type('div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(3) > div > div.react-datepicker-wrapper > div > input', helper.getDateString({day: config.endDay, month: config.month, year: config.year, delimiter: '.', format: 'dd:mm:yyyy'}));
		await page.keyboard.press('Tab');
		
		await page.click('div.warranty-expiration-report-criteria.report-criteria > section > div.button-group > button.primary-button');
		
		await helper.delay(60000);

		await page.waitForSelector('div.export-excel > a.download-to-excel');
		await page.click('div.export-excel > a.download-to-excel');

		await helper.delay(5000);

	}catch(err){

		if(err){
			console.log(err);
			returnError = err;
		}

	}

	await browser.close();
	return returnError;
};