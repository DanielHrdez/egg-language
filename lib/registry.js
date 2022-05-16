// const inspect = require('util').inspect;
// const ins = (x) => inspect(x, {depth: 2});
const specialForms = Object.create(null);
const topEnv = Object.create(null);

// From JSON to AST map
const j2a = Object.create(null);

/**
 *
 * @param {*} node
 * @return {*}
 */
function json2AST(node) { // Generic JSON traversing building the AST
  return j2a[node.type](node);
}

/**
 *
 * @param {*} obj
 * @param {*} element
 * @return {*}
 */
function checkNegativeIndex(obj, element) {
  if (Array.isArray(obj) && element < 0 ) {
    element += obj.length;
  }
  return element;
}

module.exports = {specialForms, topEnv, j2a, json2AST, checkNegativeIndex};
