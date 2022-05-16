# Lab Extending the Egg Interpreter

See the description in the notes at [Extending the Egg Interpreter](https://ull-esit-gradoii-pl.github.io/practicas/extended-egg-interpreter.html)

## Property

```js
/**
 * @class Property
 */
class Property {
  /**
   * @desc Evaluate the value
   * @param {*} env - Environment
   * @return {string} - Evaluated value
   */
  evaluate(env) {
    if (this.operator.type == 'word' && this.operator.name in specialForms) {
      const apply = new Apply(this);
      apply.type = 'apply';
      return {ast: apply, scope: env};
    }

    const theObject = this.operator.evaluate(env);
    const propsProcessed = this.args.map((arg) => arg.evaluate(env));
    const propName = checkNegativeIndex(theObject, propsProcessed[0]);

    if (theObject[propName] || propName in theObject) {
      let object = theObject;
      propsProcessed.forEach((element) => {
        const previousObject = object;
        element = checkNegativeIndex(object, element);
        object = object[element];
        if (typeof object === 'function') {
          object = object.bind(previousObject);
        }
      });
      return object;
    } else if (typeof theObject === 'function') {
      return (...args) => theObject(...propsProcessed, ...args);
    } else {
      throw new TypeError(
          'Evaluating properties for Object ' +
          `'${JSON.stringify(theObject)}' ` +
          `properties: '${JSON.stringify(propsProcessed)}'`,
      );
    }
  }

  /**
   * @desc Evaluate the left side of the apply
   * @param {*} env - Environment
   * @return {string[]} - Evaluated value
   */
  leftEvaluate(env) {
    const left = this.operator.evaluate(env);
    if (typeof left !== 'object') {
      throw new TypeError('Left-hand side of assignment must be an object');
    }
    const leftIndex = this.args.map((arg) => arg.evaluate(env));
    return [left, ...leftIndex];
  }
}
```

## Require

```js
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
```

## Eval

```js
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
```

## Object & Array & Map

```js
specialForms['object'] = (args, env) => {
  const objEnv = Object.create(env);
  const object = {};
  objEnv['self'] = object;
  for (let i = 0; i < args.length; i += 2) {
    object[args[i].evaluate(objEnv)] = args[i + 1].evaluate(objEnv);
  }
  return object;
};
topEnv['arr'] = topEnv['array'] = function(...args) {
  return args;
};
topEnv['map'] = function(...args) {
  const map = new Map();
  for (let i = 0; i < args.length; i += 2) {
    map[args[i]] = args[i + 1];
  }
  return map;
};
```

## For Loop

```js
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
```
