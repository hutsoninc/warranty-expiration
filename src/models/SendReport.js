const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sendReportSchema = new Schema({
    timestamp: Date,
    postcardsSent: Number,
    sendErrors: Number,
    unsent: Array,
    totalEvaluated: Number,
});

module.exports = mongoose.model('SendReport', sendReportSchema);
