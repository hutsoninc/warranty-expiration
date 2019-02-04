module.exports = function(scrapedObj, options) {
    return new Promise((resolve, reject) => {
        let equipmentData = options.equipmentData;

        let match = equipmentData.find(
            obj =>
                obj.id.toLowerCase() ===
                scrapedObj.PIN.toLowerCase().substr(0, obj.id.length)
        );

        // if not in equipmentData
        if (!match) {
            resolve({
                found: false,
                keep: false,
            });
        }

        // if equipment doesn't need to be kept
        if (!match.keep) {
            resolve({
                found: true,
                keep: false,
            });
        }

        let equipmentState = scrapedObj.Region.toLowerCase();

        const states = ['ky', 'tn', 'il', 'in'];

        let keep = true;

        // Filter by state and check if required fields are empty
        if (states.indexOf(equipmentState) === -1) {
            keep = false;
        } else if (!scrapedObj['Customer Name'].replace(/\s/g, '').length) {
            keep = false;
        } else if (!scrapedObj['Street 1'].replace(/\s/g, '')) {
            keep = false;
        } else if (!scrapedObj['Postal Code'].replace(/\s/g, '')) {
            keep = false;
        } else if (!scrapedObj.City.replace(/\s/g, '')) {
            keep = false;
        }

        if (!keep) {
            resolve({
                found: true,
                keep: false,
            });
        }

        // Passed checks, okay to send...
        resolve({
            found: true,
            keep: true,
            model: match.model,
        });
    });
};
