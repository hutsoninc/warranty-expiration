const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const equipmentSchema = new Schema({
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
    expirationDate: Date,
    postcardSent: Boolean,
    errorSending: Boolean,
});

module.exports = mongoose.model('Equipment', equipmentSchema);
