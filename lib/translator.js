const fs = require('fs');
const {json2AST} = require('../lib/registry');
const translate = (json, destination) => {
  const ast = json2AST(json);
  let file = 'const runtimeSupport = require(\'runtime-support\');\n';
  console.log(ast.generateJS());
  fs.writeFileSync(destination, file);
};

module.exports = translate;
