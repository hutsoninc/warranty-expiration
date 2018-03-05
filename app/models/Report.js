const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var reportSchema = new Schema({
    timestamp: Date,
    equipmentAdded: Number,
    equipmentDiscarded: Number,
    equipmentMissing: Number,
    equipmentTotal: Number,
    missingEquipment: Array
});

module.exports = mongoose.model('Report', reportSchema);