const RED = '\033[31m';
const BLUE = '\033[34m';
const DEFAULT = '\033[39m';
const blue = (str) => BLUE+str+DEFAULT;
const red = (str) => RED+str+DEFAULT;

module.exports = {BLUE, RED, DEFAULT, blue, red};
