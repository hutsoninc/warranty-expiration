# Warranty Expiration App

Scrapes warranty report and sends a postcard to customers to inform them of an upcoming warranty expiration.

## Usage

1. Make sure the Mongo daemon process ([`mongod`](https://docs.mongodb.com/manual/reference/program/mongod/)) is running
2. Run `npm run jdws` and sign in
3. Navigate to https://jdwarrantysystem.deere.com/portal/#/products/warranty-expiration
4. Make sure all locations and 'Basic Warranty' are checked and set the date range (2 months from run date)
5. Run report and download Excel sheet
6. Update the month number in `src/config.js` to the month used in step 4
7. Run `npm run start`
8. Add any missing equipment to the equipment
    1. Run `npm run sheets` to open the sheet
    2. Navigate to the Pin Cross Reference section in JD Warranty System (https://jdwarrantysystem.deere.com/portal/#/products/pin-cross-reference)
    3. Search for the missing pin numbers to find the model name
    4. Add the missing equipment model names to the sheet and sort by id
    5. Export to JSON by clicking the 'Custom' tab, then 'Export Data'
    6. Copy the JSON and paste to the `equipment.json` file under `src/data`
9. Run `npm run start` again to update the database
10. Run `npm run send` to send postcards

## Built With

* [Puppeteer](https://github.com/GoogleChrome/puppeteer) - Headless Chrome Node API
* [Lob Node](https://github.com/lob/lob-node) - Postcard automation API

## License

MIT © [Hutson Inc](https://www.hutsoninc.com)