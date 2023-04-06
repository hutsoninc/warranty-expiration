const path = require('path')
const fs = require('fs-extra')
const { getMonthName, jsonToCsv } = require('../src/utils')

const dbPath = path.join(__dirname, '../db')
const exportsPath = path.join(__dirname, '../exports')

const main = async () => {
  const todayDate = new Date()
  const todayMonth = todayDate.getMonth()
  const todayYear = todayDate.getFullYear()
  const runningForMonthNumber = todayMonth + 3 > 12 ? todayMonth - 9 : todayMonth + 3
  const runningForMonthName = getMonthName(runningForMonthNumber)
  const runningForYear = runningForMonthNumber < todayMonth ? todayYear + 1 : todayYear
  const timestamp = `${runningForMonthName}-${runningForYear}`.toLowerCase()

  const agCceLetterResultsJson = fs.readFileSync(
    path.join(dbPath, `ag-cce-letter-results-${timestamp}.json`)
  )
  const agCceLetterResults = JSON.parse(agCceLetterResultsJson)

  const turfGenericPostcardResultsJson = fs.readFileSync(
    path.join(dbPath, `turf-generic-postcard-results-${timestamp}.json`)
  )
  const turfGenericPostcardResults = JSON.parse(turfGenericPostcardResultsJson)

  const turfPowergardPostcardResultsJson = fs.readFileSync(
    path.join(dbPath, `turf-powergard-postcard-results-${timestamp}.json`)
  )
  const turfPowergardPostcardResults = JSON.parse(turfPowergardPostcardResultsJson)

  const countSentByLocationNumber = []
    .concat(
      agCceLetterResults.sent,
      turfGenericPostcardResults.sent,
      turfPowergardPostcardResults.sent
    )
    .reduce((acc, result) => {
      const locationNumber = result.hutsonLocationDetails.locationNumber

      const matchIndex = acc.findIndex(obj => obj.locationNumber === locationNumber)

      if (matchIndex !== -1) {
        acc[matchIndex].count += 1
      } else {
        acc.push({ locationNumber, count: 1 })
      }

      return acc
    }, [])

  countSentByLocationNumber.sort((a, b) => {
    return a.locationNumber - b.locationNumber
  })

  const totalCount = countSentByLocationNumber.reduce((acc, obj) => {
    acc += obj.count
    return acc
  }, 0)

  const breakout = countSentByLocationNumber.map(obj => {
    obj.percentage = obj.count / totalCount
    return obj
  })

  const breakoutCsv = await jsonToCsv(breakout)

  console.log(breakoutCsv)

  fs.writeFileSync(path.join(exportsPath, `concur-breakout-${timestamp}.csv`), breakoutCsv)
}

main()
