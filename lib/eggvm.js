const insp = require('util').inspect;
const ins = (x) => insp(x, {depth: null});
const fs = require('fs');

require('./monkey-patch.js');

const {
  specialForms,
  topEnv,
  checkNegativeIndex,
} = require('./registry.js');
// const {Value, Word, Apply, Property} = require('./ast.js');

require('./egg-require.js');

const parser = require(
    '@ull-esit-pl-2122/egg-oop-parser-daniel-hernandez-de_leon-alu0101331720',
);
const parse = parser.parse;
const parseFromFile = parser.parseFromFile;

/**
 *
 * @param {*} expr
 * @param {*} env
 */
function evaluate(expr, env) {
  expr.evaluate(env);
}

specialForms['if'] = function(args, env) {
  if (args.length != 3) {
    throw new SyntaxError('Bad number of args to if');
  }

  if (args[0].evaluate(env) !== false) {
    return args[1].evaluate(env);
  } else {
    return args[2].evaluate(env);
  }
};

specialForms['scope'] = function(args, env) {
  return env;
};

specialForms['while'] = function(args, env) {
  if (args.length !== 2) throw new SyntaxError('Bad number of args to while');
  let last = undefined;
  while (args[0].evaluate(env)) {
    last = args[1].evaluate(env);
  }
  return last;
};

specialForms['for'] = function(args, env) {
  if (args.length !== 4) {
    throw new SyntaxError('Bad number of args to for');
  }
  const [init, test, incr, body] = args;
  const scope = Object.create(env);
  let last = undefined;
  for (init.evaluate(scope); test.evaluate(scope); incr.evaluate(scope)) {
    last = body.evaluate(scope);
  }
  return last;
};

specialForms['do'] = function(args, env) {
  let value;

  args.forEach(function(arg) {
    value = arg.evaluate(env);
  });

  return value;
};

specialForms['const'] = (args, env) => {
  if (args.length !== 2 || args[0].type !== 'word') {
    throw new SyntaxError('Bad number of args to const');
  }
  const value = args[1].evaluate(env);
  Object.defineProperty(env, args[0].name, {
    configurable: false,
    set: () => {
      throw new SyntaxError('Cannot reassign const');
    },
    get: () => {
      return value;
    },
  });
  return value;
};

specialForms['child'] = (args, env) => {
  if (args.length !== 1) {
    throw new SyntaxError('Bad number of args to child');
  }
  return Object.assign({}, args[0].evaluate(env));
};

specialForms[':='] = specialForms['def'] = specialForms['define'] =
  function(args, env) {
    if (args.length !== 2 || args[0].type !== 'word') {
      throw new SyntaxError('Bad use of define');
    }
    if (env[args[0].name]) {
      throw new SyntaxError(`${args[0].name} already defined`);
    }
    const value = args[1].evaluate(env);
    env[args[0].name] = value;
    return value;
  };

specialForms['->'] = specialForms['fun'] = function(args, env) {
  if (!args.length) {
    throw new SyntaxError('Functions need a body.');
  }

  /**
   *
   * @param {*} expr
   * @return {*}
   */
  function name(expr) {
    if (expr.type != 'word') {
      throw new SyntaxError('Arg names must be words');
    }
    return expr.name;
  }

  const paramNames = args.slice(0, args.length - 1).map(name);
  const body = args[args.length - 1];

  const jsFun = function(...args) {
    if (args.length > paramNames.length) {
      throw new TypeError(
          'Wrong number of arguments. ' +
          `Called with ${args.length} arguments and ` +
          `declared ${paramNames.length} parameters`,
      );
    }
    const localEnv = Object.create(env);
    for (let i = 0; i < args.length; i++) {
      localEnv[paramNames[i]] = args[i];
    }
    return body.evaluate(localEnv);
  };

  jsFun.numParams = paramNames.length;
  return jsFun;
};

specialForms['='] = specialForms['set'] = function(args, env) {
  if (args.length !== 2) {
    throw new SyntaxError(
        `Bad use of set, expected 2 arguments but got ${args.length}`,
    );
  }

  const valueTree = args[args.length - 1];
  const value = valueTree.evaluate(env);

  const leftSide = args[0];
  let [s, ...index] = leftSide.leftEvaluate(env);

  const last = index.length - 1;
  for (let j = 0; j < last; j++) {
    index[j] = checkNegativeIndex(s, index[j]);
    s = s[index[j]];
  }
  index[last] = checkNegativeIndex(s, index[last]);
  s[index[last]] = value;
  return value;
};

specialForms['object'] = (args, env) => {
  const objEnv = Object.create(env);
  const object = {};
  objEnv['self'] = object;
  for (let i = 0; i < args.length; i += 2) {
    object[args[i].evaluate(objEnv)] = args[i + 1].evaluate(objEnv);
  }
  return object;
};

specialForms['eval'] = function(args, env) {
  if (args.length !== 1) {
    throw new SyntaxError(
        `Bad use of eval, expected 1 argument but got ${args.length}`,
    );
  }
  const arg = args[0].evaluate(env);
  const ast = arg.ast;
  const scope = arg.scope;
  return ast.evaluate(scope);
};

topEnv['debug'] = false;
topEnv['null'] = null;
topEnv['true'] = true;
topEnv['false'] = false;
topEnv['undefined'] = undefined;
topEnv['JSON'] = JSON;
topEnv['RegExp'] = require('xregexp');
topEnv['fetch'] = require('node-fetch');
topEnv['fs'] = require('fs');
topEnv['Math'] = Math;
topEnv['Object'] = Object;
topEnv['path'] = require('path');
topEnv['process'] = process;
topEnv['parse'] = parse;

// For the scope analysis
topEnv.parent = () => Object.getPrototypeOf(this);
topEnv.hasBinding = Object.hasOwnProperty;
// Warning!! with the current implementation
// Egg objects don't inherit from Object
// and don't benefit monkey patching. See registry.js
topEnv['hasOwnProperty'] = Object.prototype.hasOwnProperty;

// arithmetics
[
  '+', '-',
  '*', '/', '**',
  '%', '^',
].forEach((op) => {
  topEnv[op] = (...args) => {
    return args.reduce((acc, curr) => acc[op](curr));
  };
});

// unary
[
  '!', '~',
  'typeof', 'delete',
].forEach((op) => {
  topEnv[op] = new Function('a', `return ${op}a;`);
});

// ternary
topEnv['?'] = new Function('a, b, c', `return a ? b : c;`);

// comparison and logical
[
  '==', '!=', '===', '!==',
  '<', '>',
  '<=', '>=',
  '&&', '||',
].forEach((op) => {
  topEnv[op] = new Function('a, b', `return a ${op} b;`);
});

// bitwise
[
  '&', '|', '^',
  '<<', '>>', '>>>',
].forEach((op) => {
  topEnv[op] = new Function('a, b', `return a ${op} b;`);
});

// assignation
[
  '&=', '|=', '^=',
  '<<=', '>>=', '>>>=',
  '&&=', '||=',
  '+=', '-=',
  '*=', '/=',
  '%=', '^=',
].forEach((op) => {
  specialForms[op] = (args, env) => {
    if (args.length !== 2) {
      throw new SyntaxError(
          `Bad use of ${op}, expected 2 arguments but got ${args.length}`,
      );
    }
    const assignation = args[0];
    // eslint-disable-next-line
    const value = args[1].evaluate(env);
    const [s, ...index] = assignation.leftEvaluate(env);
    const last = index.length - 1;
    for (let j = 0; j < last; j++) {
      index[j] = checkNegativeIndex(s, index[j]);
      s = s[index[j]];
    }
    index[last] = checkNegativeIndex(s, index[last]);
    s[index[last]] = eval(`s[index[last]] ${op} value`);
    return s[index[last]];
  };
});

// assignation unary
[
  '++', '--',
].forEach((op) => {
  specialForms[op] = (args, env) => {
    if (args.length !== 1) {
      throw new SyntaxError(
          `Bad use of ${op}, expected 1 arguments but got ${args.length}`,
      );
    }
    const assignation = args[0];
    const [s, ...index] = assignation.leftEvaluate(env);
    const last = index.length - 1;
    for (let j = 0; j < last; j++) {
      index[j] = checkNegativeIndex(s, index[j]);
      s = s[index[j]];
    }
    index[last] = checkNegativeIndex(s, index[last]);
    s[index[last]] = eval(`${op}s[index[last]]`);
    return s[index[last]];
  };
});

topEnv['print'] = function(...value) {
  const processed = value.map((v) => {
    if (typeof v === 'string') return v;
    else if (typeof v == 'function') {
      const firstLines = v.toString().match(/.*/);
      return firstLines[0];
    } else if (topEnv['debug']) return ins(v);
    else {
      try {
        return JSON.stringify(v);
      } catch (e) {
        return v;
      }
    }
  });
  console.log(...processed);
  return value.length === 1? value[0] : value;
};

topEnv['arr'] = topEnv['array'] = function(...args) {
  return args;
};

topEnv['length'] = function(array) {
  return array.length;
};

topEnv['map'] = function(...args) {
  const map = new Map();
  for (let i = 0; i < args.length; i += 2) {
    map[args[i]] = args[i + 1];
  }
  return map;
};

topEnv['<-'] = topEnv['element'] = function(array, ...index) {
  if (index.length < 1) {
    throw new SyntaxError(
        `Error!: provide at least one index for array '${array}' `,
    );
  }

  try {
    let target = array;
    for (const i of index) {
      const v = (i < 0)? target.length+i : i;
      target = target[v];
    }
    if ((target == undefined) || (target == null)) {
      throw Error(
          `Error indexing '${ins(array)}' with index '${ins(index)}'. ` +
          'Accesing a non defined element!\n',
      );
    }
    return target;
  } catch (e) {
    throw new ReferenceError(
        'Error indexing ' + ins(array) +
        ' with indices ' + ins(index) + '\n' + e,
    );
  }
};

/**
 *
 * @param {*} program
 * @return {*}
 */
function run(program) {
  const env = Object.create(topEnv);
  const tree = json2AST(parse(program));
  return tree.evaluate(env);
}

/**
 *
 * @param {*} fileName
 * @return {*}
 */
function runFromFile(fileName) {
  try {
    const ast = parseFromFile(fileName);
    const tree = json2AST(ast);
    const env = Object.create(topEnv);

    const result = tree.evaluate(env);

    return result;
  } catch (err) {
    console.log(err);
  }
}

const {json2AST} = require('./j2a');

/**
 *
 * @param {*} fileName
 * @return {*}
 */
function runFromEVM(fileName) {
  try {
    const json = fs.readFileSync(fileName, 'utf8');
    const treeFlat = JSON.parse(json);
    const tree = json2AST(treeFlat);
    const env = Object.create(topEnv);
    return tree.evaluate(env);
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  json2AST,
  run,
  runFromFile,
  runFromEVM,
  topEnv,
  specialForms,
  parser,
  evaluate,
};
