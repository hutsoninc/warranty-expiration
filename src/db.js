require('dotenv').config();
const mongoose = require('mongoose');

function load() {
    return new Promise((resolve, reject) => {
        // Set up default mongoose connection
        const mongoDB = process.env.DB_LOCATION;

        mongoose.connect(mongoDB, err => {
            if (err) reject(err);
        });

        // Get the default connection
        let db = mongoose.connection;

        db.on('connected', () => {
            console.log('MongoDB connected');
            resolve();
        });

        db.on('error', err => {
            reject(err);
        });
    });
}

module.exports = {
    load,
};
