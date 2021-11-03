# Warranty Expiration App

Tool for sending warranty expiration notifications. Takes in warranty expiration and extended
warranty eligibility lists from John Deere, merges data, sends postcards and letters via
[Lob](https://www.lob.com), and creates emails lists to upload to HubSpot.

## Usage

### Step 1: Download Warranty Expiration list

1. Log into John Deere Warranty System by running `npm run jdws` and signing in
2. Navigate to https://jdwarrantysystem.deere.com/portal/#/products/warranty-expiration
3. Make sure **All Dealers** and **Basic Warranty** are checked and set the date range (2 months
   from run date or the next month that hasn't been sent)
4. Run report and download Excel sheet
5. Move the downloaded file into the `uploads` directory

### Step 2: Download PowerGard Eligibility list

1. Log into the John Deere Extended Warranty site by running `npm run pg` and signing in
2. Click **PowerGard Protection Plan - Residential (US Only)**
3. Click the **Help & Support** tab
4. Click the **Machines Eligible** link under the **Sales** column
5. Go through each program type and export the lists

   1. Click program type (ex: **Lawn Tractor**)
   2. Select **All Models**
   3. Check the **Select Multiple Dealers** checkbox
   4. Check the **All Dealers** checkbox and click the **Continue** button
   5. Click the **Search** button in the top right corner
   6. Click the **Download To Excel** button in the top right corner
   7. Go back to the program type selection and repeat this process for the next type

6. Move all exported files into the `uploads` directory

### Step 3: Send direct mail notifications

1. Run `npm run start`

   - This will merge all the lists you added to the `uploads` directory, send all print orders to
     Lob, and create an email list for PowerGard eligible turf equipment

2. If an error occurs saying there's no match for an equipment's PIN number, follow the steps for
   adding missing equipment below.

### Step 4: Send email notifications

1. Log into HubSpot and import the newest list in the `exports` directory.

   - Create a list and name it **Warranty Expiration Notification - \[month\] \[year\]**
   - Set all contacts as marketing contacts

2. Duplicate the most recent **Warranty Expiration Notification** email
3. Remove the old recipients and add the new list
4. Send the email

### How to add missing equipment

1. Open the sheet found in `src/data/equipment.csv`
2. Navigate to the Pin Cross Reference section in JD Warranty System
   (https://jdwarrantysystem.deere.com/portal/#/products/pin-cross-reference)
3. Search for the missing pin numbers to find model names
4. Add the missing equipment model names to the sheet and sort adcending by id
5. Save the file

## License

MIT © [Hutson Inc](https://www.hutsoninc.com)
