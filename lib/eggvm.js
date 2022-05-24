const insp = require('util').inspect;
const ins = (x) => insp(x, {depth: null});
const fs = require('fs');

require('./monkey-patch.js');

const {
  specialForms,
  topEnv,
  checkNegativeIndex,
} = require('./registry.js');
const {Word, Apply} = require('./ast.js');

require('./egg-require.js');

const parser = require(
    '@ull-esit-pl-2122/egg-oop-parser-daniel-hernandez-de_leon-alu0101331720',
);
const parse = parser.parse;
const parseFromFile = parser.parseFromFile;
const optimize = require('./optimizer.js');

/**
 *
 * @param {*} expr
 * @param {*} env
 */
function evaluate(expr, env) {
  expr.evaluate(env);
}

specialForms['TYPE'] = (args) => {
  if (args.length !== 2) {
    throw new SyntaxError('Bad number of args to TYPE');
  }
  const typeName = args[0].name;
  if (typeName !== typeName.toUpperCase()) {
    throw new SyntaxError('Type name must be uppercase');
  }
  const types = args[1];
  specialForms[typeName] = (typeArgs, env) => {
    if (typeArgs.length !== 2) {
      throw new SyntaxError(`Bad number of args to ${typeName}`);
    }
    const varName = typeArgs[0].name;
    const varValues = typeArgs[1];
    const checkType = (type, value) => {
      if (type.type === 'word' || type.type === 'value') {
        const typeName2 = type.name || type.value;
        const typeValue = (typeof
        (value.value || value.evaluate(env))
        ).toUpperCase();
        if (value.type === 'value') {
          if (typeValue === typeName2) return;
          throw new SyntaxError(`${value.value} is not type ${typeName2}`);
        } else if (value.type === 'word') {
          if (typeValue === typeName2) return;
          throw new SyntaxError(`${value.name} is not type ${typeName2}`);
        }
        const valueName = value.name?.toUpperCase() ||
            value.value?.toUpperCase();
        throw new SyntaxError(
            `Type mismatch, expected ${typeName2} but got ${valueName}`,
        );
      }
      if (value.type !== 'apply') {
        throw new SyntaxError(
            `Type mismatch, expected ${type.operator.name} but got ` +
            `${(value.type === 'word' ?
              typeof value.name : typeof value.value).toUpperCase()}`,
        );
      }
      if (type.operator.name !== value.operator.name.toUpperCase()) {
        throw new SyntaxError(
            `Type mismatch, expected ${type.operator.name}, ` +
            `but got ${value.operator.name}`,
        );
      }
      if (type.operator.name === 'ARRAY') {
        value.args.forEach((varArg) => {
          checkType(type.args[0], varArg);
        });
      } else if (type.operator.name === 'OBJECT') {
        if (type.args.length !== value.args.length) {
          throw new SyntaxError(
              `Type mismatch, expected ${type.args.length} ` +
              `arguments, but got ${value.args.length}`,
          );
        }
        for (let i = 0; i < type.args.length; i+=2) {
          if (type.args[i].value !== value.args[i].value) {
            throw new SyntaxError(
                `Object key mismatch, expected ${type.args[i].value}, ` +
                `but got ${value.args[i].value}`,
            );
          }
          checkType(type.args[i+1], value.args[i+1]);
        }
      } else if (type.operator.name === 'FUN') {
        if (type.args.length !== value.args.length) {
          throw new SyntaxError(
              `Type mismatch, expected ${type.args.length} arguments, ` +
              `but got ${value.args.length}`,
          );
        }
        for (let i = 0; i < type.args.length; i++) {
          checkType(type.args[i], value.args[i]);
        }
      }
    };
    checkType(types, varValues);
    const values = varValues.evaluate(env);
    const setObjProperty = (varName, types, values, env) => {
      Object.defineProperty(env, varName, {
        configurable: false,
        enumerable: true,
        set: (newValue) => {
          const typeValue = (typeof newValue).toUpperCase();
          if (types.name !== typeValue) {
            throw new SyntaxError(
                `Type mismatch, expected ${types.name}, ` +
                `but got ${typeValue}`,
            );
          }
          values = newValue;
        },
        get: () => {
          return values;
        },
      });
      if (typeof values === 'object' && !Array.isArray(values)) {
        const obj = {};
        for (let i = 0; i < types.args.length; i+=2) {
          setObjProperty(
              types.args[i].value,
              types.args[i+1],
              values[types.args[i].value],
              obj,
          );
        }
        values = obj;
      } else if (Array.isArray(values)) {
        values = setProxy(types.args[0], values);
      }
    };
    const setProxy = (types, arr) => {
      arr = new Proxy(arr, {
        set: (target, name, value) => {
          const typeValue = (typeof value).toUpperCase();
          if (types.name !== typeValue) {
            throw new SyntaxError(
                `Type mismatch, expected ${types.name}, ` +
                `but got ${typeValue}`,
            );
          }
          target[name] = value;
          return true;
        },
        get: (target, name) => {
          return target[name];
        },
      });
      arr.map((val) => {
        if (typeof val === 'object' &&
            !Array.isArray(val)) {
          const obj = {};
          for (let i = 0; i < types.args.length; i+=2) {
            setObjProperty(
                types.args[i].value,
                types.args[i+1],
                target[types.args[i].value],
                obj,
            );
          }
          return obj;
        } else if (Array.isArray(val)) {
          return setProxy(types.args[0], val);
        }
        return val;
      });
      return arr;
    };
    setObjProperty(varName, types, values, env);
    return values;
  };
};

specialForms['use'] = (args, env) => {
  if (args.length !== 1 || args[0].type !== 'word') {
    throw new SyntaxError('Bad number of args to use');
  }
  const name = args[0].evaluate(env);
  const {topEnv_, specialForms_} = require(name);
  Object.assign(topEnv, topEnv_);
  Object.assign(specialForms, specialForms_);
  return true;
};

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

specialForms['default'] = (args, env) => {
  if (args.length !== 2 || args[0].type !== 'word') {
    throw new SyntaxError('Bad number of args to default');
  }
  const [key, defaultValue] = args;
  const value = defaultValue.evaluate(env);
  env[key.name] = value;
  return value;
};

specialForms['class'] = (args, env) => {
  if (args.length !== 2 ||
    args[0].type !== 'word' ||
    args[1].operator.name !== 'object'
  ) {
    throw new SyntaxError('Bad of args to class');
  }
  const name = args[0].name;
  const methods = args[1].args;
  const objEnv = Object.create(env);
  const object = {};
  objEnv['self'] = object;
  let constructor;
  for (let i = 0; i < methods.length; i += 2) {
    if (methods[i].value !== 'constructor') {
      object[methods[i].evaluate(objEnv)] = methods[i + 1].evaluate(objEnv);
    } else {
      constructor = methods[i + 1];
    }
  }
  const cArgs = constructor.args;
  const cbody = cArgs[cArgs.length - 1];
  cArgs[cArgs.length - 1] = new Apply({
    type: 'apply',
    operator: new Word({type: 'word', name: 'do'}),
    args: [
      cbody,
      new Word({type: 'word', name: 'self'}),
    ],
  });
  topEnv[name] = {
    new: constructor.evaluate(objEnv),
  };
  return object;
};

specialForms['spread'] = (args, env) => {
  if (args.length !== 1) {
    throw new SyntaxError('Bad number of args to spread');
  }
  const array = args[0].evaluate(env);
  return {spread: array};
};

specialForms['def'] = specialForms['define'] =
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
  const defaultParams = [];
  let spreadParam;
  let paramNames = args.slice(0, args.length - 1).map((expr) => {
    if (expr.operator?.name === 'default') {
      defaultParams.push({
        name: expr.args[0].name,
        default: expr.evaluate(env),
      });
    } else if (expr.operator?.name === 'spread') {
      spreadParam = expr.args[0].name;
    } else return name(expr);
  });
  paramNames = paramNames.filter((param) => param !== undefined);
  const body = args[args.length - 1];

  const jsFun = function(...args) {
    for (const arg of args) {
      if (arg.spread) {
        args.splice(args.indexOf(arg), 0, ...arg.spread);
        args.splice(args.indexOf(arg), 1);
      }
    }
    if (args.length < paramNames.length) {
      throw new TypeError(
          'Wrong number of arguments. ' +
          `Called with ${args.length} arguments and ` +
          `declared ${paramNames.length} parameters`,
      );
    }
    const localEnv = Object.create(env);
    for (let i = 0; i < paramNames.length; i++) {
      localEnv[paramNames[i]] = args[i];
    }
    for (let i = 0; i < defaultParams.length; i++) {
      localEnv[defaultParams[i].name] =
          args[paramNames.length + i] || defaultParams[i].default;
    }
    const newLength = paramNames.length + defaultParams.length;
    localEnv[spreadParam] = [];
    for (let i = 0; i < args.length; i++) {
      localEnv[spreadParam].push(args[newLength + i]);
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
    else if (typeof v === 'number') return v;
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
 * @param {bool} optimization
 * @return {*}
 */
function runFromFile(fileName, optimization) {
  try {
    let ast = parseFromFile(fileName);
    if (optimization) ast = optimize(ast);
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
