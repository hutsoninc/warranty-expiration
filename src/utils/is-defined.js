/**
 * Check if a value is defined (not null or undefined)
 * @param {*} val - Value to test
 * @returns {boolean} Returns true if defined or false otherwise
 */
const isDefined = val => {
  return typeof val !== 'undefined' && val !== null
}

module.exports = isDefined
