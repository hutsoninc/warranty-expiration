const toListString = (arr, options = {}) => {
    const { delimiter = ',' } = options;
    const len = arr.length;
    if (len === 1) {
        return arr[0];
    }
    if (len === 2) {
        return arr.join(' and ');
    }
    let output = '';
    for (let i = 0; i < len; i++) {
        if (i === len - 1) {
            output += `and ${arr[i]}`;
            continue;
        }
        output += `${arr[i]}${delimiter} `;
    }
    return output;
};

module.exports = toListString;
