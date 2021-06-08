# Warranty Expiration App

Scrapes warranty report and sends a postcard to customers to inform them of an upcoming warranty expiration.

## Usage

1. Run `npm run jdws` and sign in
2. Navigate to https://jdwarrantysystem.deere.com/portal/#/products/warranty-expiration
3. Make sure all locations and 'Basic Warranty' are checked and set the date range (2 months from run date)
4. Run report and download Excel sheet

TODO: Add download powergard lists
TODO: Add move files into uploads folder
TODO: Add update the month/year in `src/config.js` to the date used in step 3

6. Run `npm run start`

### How to add missing equipment

1. Open the sheet found in `src/data/equipment.csv`
2. Navigate to the Pin Cross Reference section in JD Warranty System (https://jdwarrantysystem.deere.com/portal/#/products/pin-cross-reference)
3. Search for the missing pin numbers to find model names
4. Add the missing equipment model names to the sheet and sort adcending by id
5. Save the file

## Built With

* [Puppeteer](https://github.com/GoogleChrome/puppeteer) - Headless Chrome Node API
* [Lob Node](https://github.com/lob/lob-node) - Postcard automation API

## License

MIT © [Hutson Inc](https://www.hutsoninc.com)