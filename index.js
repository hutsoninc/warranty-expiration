require('dotenv').config();
const http = require('http');
const express = require('express');
var cronSchedule = require('./app/cronSchedule');

const app = express();

var server = http.createServer(app);

server.listen(process.env.PORT, process.env.HOST, () => {

    console.log("Express server running on port " + process.env.PORT);

    cronSchedule.init();

});