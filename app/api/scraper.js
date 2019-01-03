require('dotenv').config();
const puppeteer = require('puppeteer');
const helper = require('./helper.js');

exports.scrape = async function(){

	var config = {
		month: 3, // 1-12
		year: 2019
	}

	config.endDay = helper.daysInMonth(config.month, config.year);

	var returnError;

	const options = {
        headless: false,
        ignoreHTTPSErrors: true,
    };
	
	const browser = await puppeteer.launch(options);
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
		
		// Download Warranty System Data
		await page.goto('https://jdwarrantysystem.deere.com/portal/#/products/warranty-expiration');
		
		await page.waitForSelector('[title="Basic Warranty"');
		await page.waitForSelector('div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > div.react-datepicker-wrapper > div > input');
		
		await page.click('[title="Basic Warranty"]');

		await page.click('div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > div.react-datepicker-wrapper > div > input');
		
		for(i = 0; i < 10; i++){
			
			await page.keyboard.press('Backspace');
			await page.keyboard.press('Delete');
			await helper.delay(100);

		}

		await page.type('div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > div.react-datepicker-wrapper > div > input', helper.getDateString({day: 1, month: config.month, year: config.year, delimiter: '.', format: 'dd:mm:yyyy'}));
		await page.keyboard.press('Tab');
							
		for(i = 0; i < 10; i++){
			
			await page.keyboard.press('Backspace');
			await page.keyboard.press('Delete');
			await helper.delay(100);

		}

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
}