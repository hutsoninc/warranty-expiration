const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    timestamp: Date,
    equipmentAdded: Number,
    equipmentDiscarded: Number,
    equipmentMissing: Number,
    equipmentTotal: Number,
    missingEquipment: Array,
});

module.exports = mongoose.model('Report', reportSchema);
