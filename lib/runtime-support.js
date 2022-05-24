const runtimeSupport = {
  print: (...args) => {
    console.log(...args);
    return args;
  },
};
module.exports = runtimeSupport;
