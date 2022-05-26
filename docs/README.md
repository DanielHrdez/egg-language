# TFA - EGG Language

## 1. Fetch
```js
(
  def(user, ||(process.argv[3], "alu0101331720")),
  print(user),
  def(userUrl, +("https://api.github.com/users/", user)),
  print(userUrl),
  fetch(userUrl)
    .then(->(res, res.json()))
    .then(->(json, 
      print(JSON.stringify(json, null, 2))
    ))
)
```
```js
topEnv['JSON'] = JSON;
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
```

## 2. Undefined Indices, Const, no hacer def 2 veces, print escaped chars
```js
(
  const(a, [1, 2, 3]),
  print(a[10]),
)
```
Produce undefined y no se puede cambiar pq es const
```js
(
  def(a, 1),
  def(a, 1),
)
```
Tambien produce error
```js
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
```
```js
esto en el 'def'
if (!env['constants'] === s[index]) {
  s[index[last]] = value;
  return value;
} else {
  throw new SyntaxError('Cannot assign to constant');
}
```

## 3. Spread
```js
specialForms['spread'] = (args, env) => {
  if (args.length !== 1) {
    throw new SyntaxError('Bad number of args to spread');
  }
  const array = args[0].evaluate(env);
  return {spread: array};
};
```
En 'fun'
```js
if (arg.spread) {
  args.splice(args.indexOf(arg), 0, ...arg.spread);
  args.splice(args.indexOf(arg), 1);
}
```

# 4. Child y Class
```js
specialForms['child'] = (args, env) => {
  if (args.length !== 1) {
    throw new SyntaxError('Bad number of args to child');
  }
  const obj = Object.assign({}, args[0].evaluate(env));
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'function') {
        obj[key].env.self = obj;
      }
    }
  }
  return obj;
};
```
```js
specialForms['class'] = (args, env) => {
  if (args.length !== 2 ||
    args[0].type !== 'word' ||
    args[1].operator.name !== 'object'
  ) {
    throw new SyntaxError('Bad of args to class');
  }
  const name = args[0].name;
  const classObj = args[1].args;
  let constructor;
  let methods;
  let properties;
  for (let i = 0; i < classObj.length; i += 2) {
    switch (classObj[i].value) {
      case 'constructor': constructor = classObj[i + 1]; break;
      case 'methods': methods = classObj[i + 1]; break;
      case 'properties': properties = classObj[i + 1]; break;
      default: throw new SyntaxError('Bad class object');
    }
  }
  const ctArgsLength = constructor.args.length - 1;
  constructor
      .args[ctArgsLength]
      .args
      .push(new Word({type: 'word', name: 'self'}));
  env[name] = {
    new: (...args) => {
      const object = {};
      const objEnv = Object.create(env);
      objEnv['self'] = object;
      constructor.evaluate(objEnv)(...args);
      for (let i = 0; i < methods.args.length; i += 2) {
        const key = methods.args[i].evaluate(objEnv);
        const value = methods.args[i + 1].evaluate(objEnv);
        object[key] = value;
      }
      return object;
    },
  };
  Object.assign(env[name], properties.evaluate(env));
  return true;
};
```

# 5. Default values
```js
specialForms['default'] = (args, env) => {
  if (args.length !== 2 || args[0].type !== 'word') {
    throw new SyntaxError('Bad number of args to default');
  }
  const [key, defaultValue] = args;
  const value = defaultValue.evaluate(env);
  env[key.name] = value;
  return value;
};
```

# 6. Optimizations
```js
const optimize = (ast) => {
  do {
    change = false;
    ast = constantPropagation(ast, {});
    ast = constantFolding(ast);
    ast = deadCodeElimination(ast);
    ast = conditionalElimination(ast);
    inBranch.length = 0;
  } while (change);
  return ast;
};
```

# 7. Use
```js
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
```

# 8. Types
Es demasiado largo para poner en el informe.

# 9. Translate to JS
```js
const translate = (json, destination) => {
  const ast = json2AST(json);
  const code = jsBeautify(ast.generateJS({}) + ';', jsBeautifyConfig);
  fs.writeFileSync(destination, HEADER + code);
};
```
