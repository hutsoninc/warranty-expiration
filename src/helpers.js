function getDateString(options) {
    options = Object.assign(
        {
            delimiter: '/',
            format: 'mm:dd:yyyy',
            distanceTimestamp: 0,
        },
        options
    );

    if (options.distance) {
        options.distanceTimestamp = options.distance * 24 * 60 * 60 * 1000;
    }

    let d = new Date(Date.now() + options.distanceTimestamp);
    let dM = options.month || d.getMonth() + 1; // use this month if none is provided
    let dD = options.day || d.getDate(); // use today if day is not provided
    let dY = options.year || d.getFullYear(); // use this year if none is provided

    if (dM < 10) {
        dM = '0' + dM;
    }

    if (dD < 10) {
        dD = '0' + dD;
    }

    if (options.format.toLowerCase() === 'mm:dd:yyyy') {
        return [dM, dD, dY].join(options.delimiter);
    } else if (options.format.toLowerCase() === 'dd:mm:yyyy') {
        return [dD, dM, dY].join(options.delimiter);
    }
}

function daysInMonth(month, year) {
    if (year === undefined) {
        year = new Date().getFullYear();
    }

    // Month is 1-indexed (January is 1, February is 2, etc).
    return new Date(year, month, 0).getDate();
}

module.exports = {
    daysInMonth,
    getDateString,
};
