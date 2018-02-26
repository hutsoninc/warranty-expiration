const fs = require('fs');

const EQUIPMENT_DATA_PATH = './app/api/equipmentData.json'; // path from file where function is called

exports.run = function(scrapedData){

    // scrapedData is an object containing a single piece of equipment.
    // The equipment is looped through and this function tests each one.

    return new Promise((resolve, reject) => {

        fs.readFile(EQUIPMENT_DATA_PATH, 'utf8', (err, equipmentData) => {
    
            var matchIndex, matchFound, equipmentState;
            
            var equipmentData = JSON.parse(equipmentData).data;
    
            equipmentData.forEach((e, i) => {
    
                if(e.id == scrapedData.PIN.substr(0, e.id.length)){

                    matchFound = true;
                    matchIndex = i;

                }
    
            });

            // if not in equipmentData
            if(!matchFound){
    
                resolve({
                    found: false,
                    keep: false
                });
    
            }

            equipmentState = scrapedData.Region.toLowerCase();

            // Filter by state and check if required fields are empty
            if(equipmentState != 'ky'){
                if(equipmentState != 'tn'){
                    if(equipmentState != 'il'){
                        if(equipmentState != 'in'){
                            resolve({
                                found: true,
                                keep: false
                            });
                        }
                    }
                }
            }else if(!scrapedData['Customer Name'].replace(/\s/g, '').length){
                resolve({
                    found: true,
                    keep: false
                });
            }else if(!scrapedData['Street 1'].replace(/\s/g, '').length){
                resolve({
                    found: true,
                    keep: false
                });
            }else if(!scrapedData['Postal Code'].replace(/\s/g, '').length){
                resolve({
                    found: true,
                    keep: false
                });
            }else if(!scrapedData.City.replace(/\s/g, '').length){
                resolve({
                    found: true,
                    keep: false
                });
            }
            
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
    
            }
    
        });

    });

}