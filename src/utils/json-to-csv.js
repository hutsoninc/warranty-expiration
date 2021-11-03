const { parse } = require('json2csv')

const jsonToCsv = (data, opts = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      fields: Object.keys(data[0]),
      ...opts,
    }

    try {
      const csv = parse(data, options)
      resolve(csv)
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = jsonToCsv
