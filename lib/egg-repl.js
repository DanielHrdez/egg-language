const XRegExp = require('xregexp');
// const inspect = require('util').inspect;
// const ins = (x) => inspect(x, {depth: null});
const readline = require('readline');
const egg = require('./eggvm.js');
const {eggExit, help} = require('./extensions'); // extend eggvm
const topEnv = egg.topEnv;
const specialForms = egg.specialForms;
const parser = egg.parser;
const parse = parser.parse;
const {DEFAULT, red} = require('./colors.js');
const PROMPT = DEFAULT+'> ';

// Check if program is empty
const ALLWHITE = new XRegExp('^'+egg.parser.SPACE.source+'$');
// const LP = parser.LP;
// const RP = parser.RP;
const getTokens = parser.getTokens;
const parBalance = parser.parBalance;
const {json2AST} = require('./registry.js');

const put = egg.topEnv.print; /* (r) => {
  if (typeof r === 'string') console.log(r)
  else console.log(ins(r));
}; */
const optimize = require('./optimizer');

/**
 * @param {*} optimization
 */
function eggRepl(optimization) {
  let program = '';
  let stack = 0;
  try {
    const rl = readline.createInterface(
        {input: process.stdin, output: process.stdout, completer},
    );
    rl.prompt(PROMPT); console.log('Version '+topEnv['version']);
    rl.prompt();
    rl.on('line', function(line) {
      stack += parBalance(line);
      line = line + '\n';
      program += line;
      if (stack <= 0 && !ALLWHITE.test(program)) {
        try {
          let r;
          if (optimization) {
            r = json2AST(optimize(parse(program))).evaluate(topEnv);
          } else r = json2AST(parse(program)).evaluate(topEnv);
          put(r);
        } catch (e) {
          console.log(red(e.message));
        }
        program = '';
        stack = 0;
      }
      rl.setPrompt(PROMPT + '..'.repeat(stack));
      rl.prompt();
    });
    rl.on('close', eggExit);
    rl.on('SIGINT', () => {
      console.log(red('Expression discarded!'));
      program = '';
      stack = 0;
      rl.clearLine(process.stdout);
      rl.setPrompt(PROMPT);
      rl.prompt();
    });
  } catch (err) {
    console.log(red(err));
    help();
  }

  process.stdin.on('end', eggExit);

  /**
   *
   * @param {*} line
   * @return {Array}
   */
  function completer(line) {
    const tokens = getTokens(line);
    const word = tokens.filter((t) => t && t.type === 'WORD').pop().value;
    const allKeys = Object.keys(specialForms).concat(Object.keys(topEnv));
    const hits = allKeys.filter((key) => key.startsWith(word));
    return [hits, word];
  }
}

module.exports = eggRepl;


