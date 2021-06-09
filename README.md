# Warranty Expiration App

Tool for sending warranty expiration notifications. Takes in warranty expiration and extended warranty eligibility lists from John Deere, merges data, sends postcards and letters via [Lob](https://www.lob.com), and creates emails lists to upload to HubSpot.

## Usage

1. Run `npm run jdws` and sign in
2. Navigate to https://jdwarrantysystem.deere.com/portal/#/products/warranty-expiration
3. Make sure all locations and 'Basic Warranty' are checked and set the date range (2 months from run date)
4. Run report and download Excel sheet

TODO: Add download powergard lists
TODO: Add move files into uploads folder
TODO: Add update the month/year in `src/config.js` to the date used in step 3

6. Run `npm run start`

TODO: Add how to send PowerGard email

### How to add missing equipment

1. Open the sheet found in `src/data/equipment.csv`
2. Navigate to the Pin Cross Reference section in JD Warranty System (https://jdwarrantysystem.deere.com/portal/#/products/pin-cross-reference)
3. Search for the missing pin numbers to find model names
4. Add the missing equipment model names to the sheet and sort adcending by id
5. Save the file
## License

MIT © [Hutson Inc](https://www.hutsoninc.com)