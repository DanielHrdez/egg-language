const topEnv = require('../lib/registry.js').topEnv;
const arithmetics = [
  '+', '-',
  '*', '/', '**',
  '%', '^',
  '!', '~',
  'typeof', 'delete',
  '==', '!=', '===', '!==',
  '<', '>',
  '<=', '>=',
  '&&', '||',
  '&', '|', '^',
  '<<', '>>', '>>>',
  '&=', '|=', '^=',
  '<<=', '>>=', '>>>=',
  '&&=', '||=',
  '+=', '-=',
  '*=', '/=',
  '%=', '^=',
  '++', '--',
];
const inBranch = [];
let change = false;
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

const constantFolding = (ast) => {
  if (ast.type === 'apply') {
    if (arithmetics.includes(ast.operator.name) &&
        ast.operator.type === 'word') {
      ast.args = ast.args.map((arg) => constantFolding(arg));
      if (ast.args.every((arg) => arg.type === 'value')) {
        const values = ast.args.map((arg) => arg.value);
        change = true;
        return {type: 'value', value: topEnv[ast.operator.name](...values)};
      }
    }
    ast.args = ast.args.map((arg) => constantFolding(arg));
  }
  return ast;
};

const constantPropagation = (ast, env, addToBranch) => {
  if (ast.type === 'word') {
    if (ast.name in env && !(inBranch.includes(ast.name))) {
      change = true;
      return env[ast.name];
    }
    return ast;
  }
  if (ast.type === 'apply') {
    const astOpName = ast.operator.name;
    if (['if', 'while', 'for'].includes(astOpName)) {
      ast.args = ast.args.map((arg) => {
        return constantPropagation(arg, env, true);
      });
      return ast;
    } else if (astOpName === 'def' || astOpName === '=') {
      const [name, value] = ast.args;
      env[name.name] = value.value ? value : constantPropagation(value, env);
      if (addToBranch) inBranch.push(name.name);
      return ast;
    }
    ast.args = ast.args.map((arg) => constantPropagation(arg, env));
  }
  return ast;
};

const deadCodeElimination = (ast) => {
  const variables = [];
  const search = (ast) => {
    if (ast.type === 'word') {
      if (!variables.find((v) => v.name === ast.name)) {
        variables.push({name: ast.name, count: 1});
      } else if (ast.name !== '=') {
        variables.find((v) => v.name === ast.name).count++;
      }
    } else if (
      ast.type === 'apply' &&
      ast.operator.name === '=' &&
      variables.find((v) => v.name === ast.args[0].name)) {
      return;
    } else if (ast.type === 'apply') {
      ast.args.forEach((arg) => search(arg));
    }
  };
  search(ast);
  const remove = (ast) => {
    if (ast.type === 'apply') {
      if ((ast.operator.name === 'def' || ast.operator.name === '=') &&
          variables.find((v) => v.name === ast.args[0].name).count === 1) {
        change = true;
        return undefined;
      }
      ast.args = ast.args.map(remove);
      ast.args = ast.args.filter((arg) => arg !== undefined);
    }
    return ast;
  };
  remove(ast);
  return ast;
};

const conditionalElimination = (ast) => {
  if (ast.type === 'apply') {
    if (ast.operator.name === 'if') {
      const [cond, then, else_] = ast.args;
      if ((cond.type === 'value' && cond.value) ||
          (cond.type === 'word' && topEnv[cond.name])) {
        change = true;
        return then;
      }
      if ((cond.type === 'value' && !cond.value) ||
          (cond.type === 'word' && !topEnv[cond.name])) {
        change = true;
        return else_;
      }
    } else if (ast.operator.name === 'while') {
      const cond = ast.args[0];
      if ((cond.type === 'value' && !cond.value) ||
      (cond.type === 'word' && !topEnv[cond.name])) {
        change = true;
        return;
      }
    } else if (ast.operator.name === 'for') {
      const cond = ast.args[1];
      if ((cond.type === 'value' && !cond.value) ||
          (cond.type === 'word' && !topEnv[cond.name])) {
        change = true;
        return;
      }
    }
    ast.args = ast.args.map((arg) => conditionalElimination(arg));
    ast.args = ast.args.filter((arg) => arg !== undefined);
  }
  return ast;
};

module.exports = optimize;
