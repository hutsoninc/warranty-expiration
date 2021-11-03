const xlsx = require('xlsx')

const xlsxToJson = filePath => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath)
      resolve(xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]))
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = xlsxToJson
