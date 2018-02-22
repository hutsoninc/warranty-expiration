var fs = require('fs');
var minify = require('html-minifier').minify;

var templateSource = './app/templates/';
var templateDest = './app/templates/dist/';

fs.readdir(templateSource, (error, files) => {

    if (error) throw error;

    files.forEach((file, index) => {

        if(file.indexOf('.html') !== -1){
    
            fs.readFile(templateSource + file, 'utf8', (err, data) => {
        
                var result = minify(data, {
                    collapseWhitespace: true,
                    minifyCSS: true,
                    removeComments: true
                });

                var fileNoExt = file.substr(0, file.indexOf('.html'));
                
                fs.writeFile(templateDest + fileNoExt + '.min.html', result, (err) => {
        
                    if (err) throw err;
                    console.log(file + ' has been minified and saved');
        
                });
    
            });

        }

    });

});