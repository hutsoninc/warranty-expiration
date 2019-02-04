const fs = require('fs');
const path = require('path');
const minify = require('html-minifier').minify;

const SOURCE = path.join(__dirname, '../src/templates/');
const DEST = path.join(SOURCE, 'dist/');

fs.readdir(SOURCE, (err, files) => {
    if (err) console.error(err);

    files.forEach(file => {
        if (file.indexOf('.html') !== -1) {
            fs.readFile(SOURCE + file, 'utf8', (err, data) => {
                if (err) console.error(err);
                let result = minify(data, {
                    collapseWhitespace: true,
                    minifyCSS: true,
                    removeComments: true,
                });

                let fileNoExt = file.substr(0, file.indexOf('.html'));

                fs.writeFile(DEST + fileNoExt + '.min.html', result, err => {
                    if (err) console.error(err);
                    console.log(file + ' minified and saved');
                });
            });
        }
    });
});
