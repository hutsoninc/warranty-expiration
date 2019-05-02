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
    - Run `npm run sheets` to open the sheet
    - Add the missing equipment and sort id descending
    - Export to JSON by clicking the 'Custom' tab, then 'Export Data'
    - Copy the JSON and paste to the `equipment.json` file under `src/data`
9. Run `npm run start` again to update the database
10. Run `npm run send` to send postcards

## Built With

* [Puppeteer](https://github.com/GoogleChrome/puppeteer) - Headless Chrome Node API
* [Lob Node](https://github.com/lob/lob-node) - Postcard automation API

## License

MIT © [Hutson Inc](https://www.hutsoninc.com)