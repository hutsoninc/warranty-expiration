require('dotenv').config();
const postcards = require('./app/api/postcards.js')
const app = require('./app.js');

app.load().then(() => {

    postcards.send();

}, (err) => {

    console.log(err);

});