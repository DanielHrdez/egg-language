const fs = require('fs');
const {json2AST} = require('../lib/registry');
const {version} = require('../package.json');
const jsBeautify = require('js-beautify');
const HEADER = `/**
 * Generated with Egg translator
 * @author Daniel Hernández de León Alu0101331720
 * @version ${version}
 * @license MIT
 */
const libPath =
  '@ull-esit-pl-2122/tfa-daniel-hernandez-de_leon-alu0101331720/lib/';
const {runtimeSupport} = require(\`\${libPath}/runtime-support\`);
`;
const jsBeautifyConfig = {
  indent_size: 2,
  space_in_empty_paren: true,
  end_with_newline: true,
  preserve_newlines: false,
};
const translate = (json, destination) => {
  const ast = json2AST(json);
  const code = jsBeautify(ast.generateJS({}) + ';', jsBeautifyConfig);
  fs.writeFileSync(destination, HEADER + code);
};

module.exports = translate;
