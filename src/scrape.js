require('dotenv').config();
const puppeteer = require('puppeteer');
const { getDateString } = require('./helpers.js');
const { delay } = require('@hutsoninc/utils');

module.exports = async function(options) {
    options = Object.assign({}, options);

    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true
    });
    let page = await browser.newPage();

    try {
        if (process.env.NODE_ENV == 'production') {
            await page._client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: options.downloadPath,
            });
        }

        await page.goto('https://dealerpath.deere.com/');

        await page.waitForSelector('#username');
        await page.type('#username', process.env.DEERE_USER);
        await page.type('[type="password"]', process.env.DEERE_PWD);
        await delay(1000);
        await page.click('[name="login"]');

        await delay(5000);

        await page.evaluate(() => {
            const loginTitle = document.querySelector('.login-title');

            if (loginTitle) {
                if (loginTitle.innerText == 'Reset Password') {
                    throw new Error('Password Expired');
                }
            }

            return;
        });

        // Download Warranty System Data
        await page.goto(
            'https://jdwarrantysystem.deere.com/portal/#/products/warranty-expiration'
        );

        await page.waitForSelector('[title="Basic Warranty"');
        await page.waitForSelector(
            'div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > div.react-datepicker-wrapper > div > input'
        );

        await page.click('[title="Basic Warranty"]');

        await page.click(
            'div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > div.react-datepicker-wrapper > div > input'
        );

        for (i = 0; i < 10; i++) {
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Delete');
            await delay(100);
        }

        await page.type(
            'div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(1) > div > div.react-datepicker-wrapper > div > input',
            getDateString({
                day: 1,
                month: options.month,
                year: options.year,
                delimiter: '.',
                format: 'dd:mm:yyyy',
            })
        );
        await page.keyboard.press('Tab');

        for (i = 0; i < 10; i++) {
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Delete');
            await delay(100);
        }

        await page.type(
            'div.warranty-expiration-date-range-criteria > section > ul > li:nth-child(3) > div > div.react-datepicker-wrapper > div > input',
            getDateString({
                day: options.endDay,
                month: options.month,
                year: options.year,
                delimiter: '.',
                format: 'dd:mm:yyyy',
            })
        );
        await page.keyboard.press('Tab');

        await page.click(
            'div.warranty-expiration-report-criteria.report-criteria > section > div.button-group > button.primary-button'
        );

        await delay(60000);

        await page.waitForSelector('div.export-excel > a.download-to-excel');
        await page.click('div.export-excel > a.download-to-excel');

        await delay(5000);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    await browser.close();
    return;
};
