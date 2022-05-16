const {j2a, json2AST, topEnv} = require('./registry.js');
const {Value, Word, Apply, Property} = require('./ast.js');

j2a['value'] = (j) => {
  const obj = new Value(j);
  if (typeof obj.value === 'object') {
    obj.value = new topEnv[obj.value.type](...obj.value.info);
  }
  return obj;
};
j2a['word'] = (j) => new Word(j);
j2a['apply'] = (j) => {
  j.operator = j2a[j.operator.type](j.operator);
  j.args = j.args.map((arg) => j2a[arg.type](arg));
  return new Apply(j);
};

j2a['property'] = (j) => {
  j.operator = j2a[j.operator.type](j.operator);
  j.args = j.args.map((arg) => j2a[arg.type](arg));
  return new Property(j);
};

module.exports = {j2a, json2AST};
