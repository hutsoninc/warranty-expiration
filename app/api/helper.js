
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
	var dM = d.getMonth() + 1; // starts at 0
	var dD = d.getDate();
    var dY = d.getFullYear();

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