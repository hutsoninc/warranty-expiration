require('dotenv').config();
const mongoose = require('mongoose');

exports.load = function(){

	return new Promise(function(resolve, reject){
			
		// Set up default mongoose connection
		var mongoDB = 'mongodb://' + process.env.DB_LOCATION;

		mongoose.connect(mongoDB, function(err) {

			if(err) return console.error(err);

		});

		// Get the default connection
		var db = mongoose.connection;

		db.on('connected', function(ref){

			console.log('MongoDB connected');
			resolve();

		});

		db.on('error', function(err){

			reject(err);

		});

	});

}