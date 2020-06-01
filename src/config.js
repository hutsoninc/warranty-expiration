const path = require('path');
const fs = require('fs');
const { daysInMonth } = require('./helpers');

let config = {
    month: 8, // 1-12
    year: 2020,
};

config.endDay = daysInMonth(config.month, config.year);

const equipmentData = fs.readFileSync(
    path.join(__dirname, 'data/equipment.json')
);
const templateFront = fs.readFileSync(
    path.join(__dirname, 'templates/dist/warranty4x6Front.min.html')
);
const templateBack = fs.readFileSync(
    path.join(__dirname, 'templates/dist/warranty4x6Back.min.html')
);

module.exports = {
    downloadPath:
        process.env.NODE_ENV === 'production'
            ? path.join(__dirname, 'downloads/')
            : path.join(process.env.USERPROFILE, 'Downloads/'),
    models: {
        Equipment: require('./models/Equipment.js'),
        Report: require('./models/Report.js'),
        SendReport: require('./models/SendReport.js'),
    },
    template: {
        back: templateBack,
        front: templateFront,
    },
    equipmentData: JSON.parse(equipmentData).data,
    ...config,
};
