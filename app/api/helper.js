
exports.delay = function(time){
    return new Promise(function(resolve){ 
        setTimeout(resolve, time);
    });
}

exports.getDateString = function(config){

    var delimiter = config.delimiter || '/';
    var format = config.format || 'mm:dd:yyyy';
    var distanceTimestamp = 0;

    if(config.distance){
        distanceTimestamp = config.distance * 24 * 60 * 60 * 1000;
    }

	var d = new Date(Date.now() + distanceTimestamp);
	var dM = config.month || d.getMonth() + 1; // use this month if none is provided
	var dD = config.day || d.getDate(); // use today if day is not provided
    var dY = config.year || d.getFullYear(); // use this year if none is provided

    if(dM < 10){
        dM = '0' + dM;
    }

    if(dD < 10){
        dD = '0' + dD;
    }

    if(format.toLowerCase() == 'mm:dd:yyyy'){
        return dM + delimiter + dD + delimiter + dY;
    }else if(format.toLowerCase() == 'dd:mm:yyyy'){
        return dD + delimiter + dM + delimiter + dY;
    }

}

exports.daysInMonth = function(month, year){

    if(year == undefined){
        year = new Date().getFullYear();
    }

    // Month is 1-indexed (January is 1, February is 2, etc).
    return new Date(year, month, 0).getDate();

}