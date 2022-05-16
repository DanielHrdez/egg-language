const fs = require('fs');
const readFile = (x) => fs.readFileSync(x, 'utf-8');
// const insp = require('util').inspect;
// const ins = (x) => insp(x, {depth: null});
const {specialForms, topEnv, json2AST} = require('./registry.js');
const path = require('path');

const parser = require(
    '@ull-esit-pl-2122/egg-oop-parser-daniel-hernandez-de_leon-alu0101331720',
);
const parse = parser.parse;

/**
 *
 * @param {*} args
 * @param {*} env
 * @return {*}
 */
function REQUIRE(args, env) {
  if (args.length !== 1) {
    throw new SyntaxError('Bad number of args to require');
  }
  const name = args[0].value;
  if (name in REQUIRE.cache) {
    return REQUIRE.cache[name];
  }
  const file = path.join(process.cwd(), name);
  const code = readFile(file);
  const ast = parse(code);
  env = Object.create(topEnv);
  const evaluated = json2AST(ast).evaluate(env);
  REQUIRE.cache[name] = evaluated;
  return evaluated;
}
REQUIRE.cache = Object.create(null);

specialForms['require'] = REQUIRE;

module.exports = REQUIRE;
