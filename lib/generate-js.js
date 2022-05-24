const generateJSForms = Object.create(null);
['+', '-', '*', '/', '==', '<', '>', '&&', '||'].forEach((op) => {
  generateJSForms[op] = function(args, scope) {
    return `(${args[0].generateJS(scope)} ${op} ${args[1].generateJS(scope)})`;
  };
});
generateJSForms['print'] = function(args, scope) {
  let result = 'runtimeSupport.print(';
  args.forEach((arg) => {
    result += arg.generateJS(scope) + ', ';
  });
  return result.slice(0, -2) + ')';
};
generateJSForms['do'] = function(args, scope) {
  const result = '(() => {';
  args = args.map((arg) => arg.generateJS(scope));
  if (args[args.length - 1].startsWith('let') ||
      args[args.length - 1].startsWith('const')) {
    args[args.length - 1] = args[args.length - 1]
        .slice(args[args.length - 1].indexOf('=') + 2);
  }
  args[args.length - 1] = 'return ' + args[args.length - 1];
  return result + args.join(';') +';})()';
};
generateJSForms['fun'] = generateJSForms['->'] = function(args, scope) {
  const last = args.length - 1;
  const fArgs = args
      .slice(0, last)
      .map((arg) => arg.generateJS(scope));
  const fBody = args[last].generateJS(scope) + ';';
  fArgs.forEach((arg) => {
  });
  return `(${fArgs.join(', ')}) => {` +
    `return ${fBody}}`;
};
generateJSForms['='] = generateJSForms['set'] = function(args, scope) {
  const name = args[0].generateJS(scope);
  const value = args[1].generateJS(scope);
  return `${name} = ${value}`;
};
generateJSForms['def'] = generateJSForms['define'] = function(args, scope) {
  if (args.length != 2) throw new Error('define only accepts two arguments');
  const name = args[0].generateJS(scope);
  const value = args[1].generateJS(scope);
  return `let ${name} = ${value}`;
};
generateJSForms['const'] = function(args, scope) {
  const name = args[0].generateJS(scope);
  const value = args[1].generateJS(scope);
  return `const ${name} = ${value}`;
};
generateJSForms['while'] = function(args, scope) {
  const condition = args[0].generateJS(scope);
  const body = args[1].generateJS(scope);
  return `(() => {let $lastWhileValue; while (${condition}) {` +
    `$lastWhileValue = ${body};}return $lastWhileValue;})()`;
};
module.exports = {generateJSForms};
