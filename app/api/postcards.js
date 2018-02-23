require('dotenv').config();
var fs = require('fs');
var Lob = require('lob')(process.env.LOB_KEY);
var Equipment = require('./../models/equipment.js');

// Source depends on where the send function is called
var templateFrontSrc = './app/templates/dist/warranty4x6Front.min.html';
var templateBackSrc = './app/templates/dist/warranty4x6Back.min.html';
var templateFront, templateBack;

exports.send = function(){

    fs.readFile(templateFrontSrc, 'utf8', (err, data) => {
        templateFront = data;
    });

    fs.readFile(templateBackSrc, 'utf8', (err, data) => {
        templateBack = data;
    });
    
    Equipment.find({postcardSent: false}).exec(function(err, result){
        
        if(err) return console.error(err);

        result.forEach(function(e, i){

            var model = e.model || 'equipment';

            // Send postcard
            Lob.postcards.create({
                description: 'Warranty Postcard Serial #: ' + e._id,
                to: {
                    name: e.name,
                    address_line1: e.street1,
                    address_line2: e.street2,
                    address_city: e.city,
                    address_state: e.region,
                    address_zip: e.postalCode
                },
                front: templateFront,
                back: templateBack,
                merge_variables: {
                    serial: e._id,
                    model: model
                }
            }, function (err, res){
                console.log(res);
                if(err) console.log(err);
            });

            // Mark as sent
            Equipment.update(
                {_id: e._id}, 
                {postcardSent: true}, 
                function(err){
                    if(err) return console.error(err);
                }
            );
        
        });
        
    });

}