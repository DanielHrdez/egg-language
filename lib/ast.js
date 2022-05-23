// const inspect = require('util').inspect;
// const ins = (x) => inspect(x, { depth: null });

const {specialForms, checkNegativeIndex} = require('./registry.js');
const {setAsUsed, generateJSForms} = require('./generate-js.js');

/**
 * @class Value
 */
class Value {
  /**
   * @desc Constructor for Value
   * @param {object} token - Token object
   */
  constructor(token) {
    this.type = token.type;
    this.value = token.value;
  }

  /**
   * @desc Evaluate the value
   * @return {string} - Evaluated value
   */
  evaluate() {
    return this.value;
  }

  /**
   * @desc Evaluate the left side of the value
   */
  leftEvaluate() {
    throw new TypeError('Invalid left-hand side in assignment');
  }

  /**
   * @desc Stringify the value
   * @return {string} - Stringified value
   */
  getIndex() {
    return this.value;
  }

  /**
   * @return {*}
   */
  generateJS() {
    if (typeof this.value === 'number') {
      return this.value;
    }
    return `'${this.value}'`;
  }
}

/**
 * @class Word
 */
class Word {
  /**
   * @desc Constructor for Word
   * @param {object} token - Token object
   */
  constructor(token) {
    this.type = token.type || 'word';
    this.name = token.name;
  }

  /**
   * @desc Evaluate the value
   * @param {*} env - Environment
   * @return {string} - Evaluated value
   */
  evaluate(env) {
    if (this.name in env) {
      return env[this.name];
    } else {
      throw new ReferenceError(`Undefined variable: ${this.name}`);
    }
  }

  /**
   * @desc Return the name of the word
   * @return {string} - Name of the word
   */
  getIndex() {
    return this.name;
  }

  /**
   * @desc Evaluate the left side of the word
   * @param {*} env - Environment
   * @return {string[]} - Evaluated value
   */
  leftEvaluate(env) {
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, this.name)) {
        return [scope, this.name];
      }
    }
    throw new ReferenceError(
        `Tried setting an undefined variable: ${this.name}`,
    );
  }

  /**
   *
   * @param {*} scope
   * @return {*}
   */
  generateJS(scope) {
    const eggName = '$'+this.name;
    setAsUsed(scope, eggName);
    return eggName;
  }
}

/**
 * @class Apply
 */
class Apply {
  /**
   * @desc Constructor for Apply
   * @param {*} tree - Tree
   */
  constructor(tree) {
    this.type = tree.type;
    this.operator = tree.operator;
    this.args = tree.args;
  }

  /**
   * @desc Evaluate the value
   * @param {*} env - Environment
   * @return {string} - Evaluated value
   */
  evaluate(env) {
    if (this.operator.type == 'word' && this.operator.name in specialForms) {
      return specialForms[this.operator.name](this.args, env);
    }

    try {
      const op = this.operator.evaluate(env);
      const argsProcessed = this.args.map((arg) => arg.evaluate(env));

      if ((typeof op === 'function')) {
        return op(...argsProcessed);
      }
    } catch (err) {
      throw new TypeError('Applying not a function or method ' + err);
    }
  }

  /**
   * @desc Evaluate the left side of the apply
   * @return {*}
   */
  leftEvaluate() {
    const left = this.evaluate(env);
    if (Array.isArray(left) && typeof left[0] === 'object') {
      return left;
    }
    throw new TypeError('Invalid left-hand side in assignment');
  }
  /**
   * @param {*} scope
   * @return {*}
   */
  generateJS(scope) {
    if (this.operator.type === 'word') {
      if (generateJSForms[this.operator.name]) {
        return generateJSForms[this.operator.name](this.args, scope);
      } else {
        const opTranslation = this.operator.generateJS(scope);
        if (opTranslation && scope[opTranslation].declared) {
          const argsTranslated = this.args.map((arg) => arg.generateJS(scope));
          return `${opTranslation}(${argsTranslated})`;
        } else if (opTranslation && !scope[opTranslation].declared) {
          if (this.operator.name in specialForms) {
            const errorMsg =
                `Translation of "${this.operator.name}" not implemented yet.\n`;
            console.error(errorMsg);
            process.exit(1);
          }
          console.warn(
              `Warning: Non declared symbol ` +
              `"${this.operator.name}" used as function.\n`,
          );
          const argsTranslated = this.args.map((arg) => arg.generateJS(scope));
          return `${opTranslation}(${argsTranslated})`;
        } else {
          const errMsg = `Fatal error.\n`+
              `AST=${JSON.stringify(this)}.\nscope=${JSON.stringify(scope)}.\n`;
          console.error(errMsg);
          process.exit(0);
        }
      }
    } else if (this.operator.type == 'apply') {
      const argsTranslated = this.args.map((arg) => arg.generateJS(scope));
      return `${this.operator.generateJS(scope)}(${argsTranslated})`;
    }
  }
}

/**
 * @class Property
 */
class Property {
  /**
   * @desc Constructor for Property
   * @param {*} tree - Tree
   */
  constructor(tree) {
    this.type = tree.type;
    this.operator = tree.operator;
    this.args = tree.args;
  }

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

    if (
      theObject[propName] ||
      propName in theObject ||
      Array.isArray(theObject)
    ) {
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

module.exports = {Value, Word, Apply, Property};
