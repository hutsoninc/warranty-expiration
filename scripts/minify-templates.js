const fs = require('fs')
const path = require('path')
const minify = require('html-minifier').minify

const sourcePath = path.join(__dirname, '../src/templates/')
const destPath = path.join(sourcePath, 'dist/')

try {
  console.log('Minifying HTML templates...')
  fs.readdir(sourcePath, (err, files) => {
    if (err) {
      throw new Error(err)
    }

    files.forEach(file => {
      const { ext, name } = path.parse(file)
      if (ext !== '.html') {
        return
      }
      fs.readFile(path.join(sourcePath, file), 'utf8', (err, data) => {
        if (err) {
          throw new Error(err)
        }

        const minifiedHtml = minify(data, {
          collapseWhitespace: true,
          minifyCSS: true,
          removeComments: true,
        })

        fs.writeFile(path.join(destPath, `${name}.min.html`), minifiedHtml, err => {
          if (err) {
            throw new Error(err)
          }
        })
      })
    })
  })
} catch (err) {
  console.error(err)
  process.exit(1)
}
