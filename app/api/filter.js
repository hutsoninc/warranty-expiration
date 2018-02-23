const fs = require('fs');

const EQUIPMENT_DATA_PATH = './app/api/equipmentData.json'; // path from file where function is called

exports.run = function(scrapedData){

    return new Promise((resolve, reject) => {

        fs.readFile(EQUIPMENT_DATA_PATH, 'utf8', (err, equipmentData) => {
    
            var matchIndex, matchFound;
            
            var equipmentData = JSON.parse(equipmentData).data;
    
            equipmentData.forEach((e, i) => {
    
                if(e.id == scrapedData.PIN.substr(0, e.id.length)){

                    matchFound = true;
                    matchIndex = i;

                }
    
            });
            
            // if found entry in equipmentData
            if(matchFound){
    
                // check if entry needs to be kept
                if(equipmentData[matchIndex].keep){
                    
                    // if kept
                    resolve({
                        found: true,
                        keep: true,
                        model: equipmentData[matchIndex].model
                    });
                
                }else{
                    
                    // if not kept
                    resolve({
                        found: true,
                        keep: false
                    });
    
                }
    
            }else{

                console.log(scrapedData);
    
                // if not in equipmentData
                resolve({
                    found: false,
                    keep: false
                });
    
            }
    
        });

    });

}