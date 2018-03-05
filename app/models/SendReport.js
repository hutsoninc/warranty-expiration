const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var sendReportSchema = new Schema({
    timestamp: Date,
    postcardsSent: Number,
    errors: Number,
    totalEvaluated: Number
});

module.exports = mongoose.model('SendReport', sendReportSchema);