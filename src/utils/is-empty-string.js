/**
 * Check if a value is an empty string (contains only spaces, tabs, and new lines)
 * @param {*} val - Value to test
 * @returns {boolean} Returns true if empty or false otherwise
 */
const isEmptyString = (val) => {
    return val === '' || !/[\S]/g.test(val);
};

module.exports = isEmptyString;
