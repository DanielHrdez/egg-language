// let insp = require('util').inspect;

const binOp = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
};

['+', '-', '*', '/'].forEach((op) => {
  // eslint-disable-next-line
  Number.prototype[op] = function(...args) {
    try {
      let sum = this;
      for (let i = 0; i < args.length; i++) {
        sum = binOp[op](sum, args[i]);
      }
      return sum;
    } catch (e) {
      throw new Error(`Error in Number method '${op}'\n`, e);
    }
  };
  // eslint-disable-next-line
  String.prototype[op] = function(...args) {
    try {
      let sum = this;
      for (let i = 0; i < args.length; i++) {
        sum = binOp[op](sum, args[i]);
      }
      return sum;
    } catch (e) {
      throw new Error(`Error in String method '${op}'\n`, e);
    }
  };
});
