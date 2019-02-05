require('dotenv').config();
const sendPostcards = require('./src/send-postcards.js')
const db = require('./src/db.js');

db.load().then(() => {

    sendPostcards();

}, (err) => {

    console.log(err);

});