const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var equipmentSchema = new Schema({
	_id: String,
	model: String,
	account: Number,
	name: String,
	street1: String,
	street2: String,
	postalCode: String,
	city: String,
	region: String,
	country: String,
	warrantyType: String,
	expirationDate: String,
	postcardSent: Boolean
});

module.exports = mongoose.model('Equipment', equipmentSchema);