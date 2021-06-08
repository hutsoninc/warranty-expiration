const months = require('./months');

const getMonthName = (monthNumber) => {
    return months[Number(monthNumber) - 1];
};

module.exports = getMonthName;
