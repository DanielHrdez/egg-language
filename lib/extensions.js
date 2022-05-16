const {BLUE, DEFAULT} = require('./colors.js');
const {specialForms, topEnv} = require('./registry.js');

const eggExit = specialForms['exit'] = () => {
  console.log(BLUE+'goodbye!'+DEFAULT);
  process.exit(0);
};

const HELP = [
  (BLUE+'help()'+DEFAULT+' shows this help'),
  (BLUE+'exit()'+DEFAULT+' exit REPL loop'),
  (BLUE+'CTRL-D'+DEFAULT+' exit REPL loop'),
  (BLUE+'version'+DEFAULT+' shows the version'),
];

const help = specialForms['help'] = () => {
  for (const h of HELP.sort()) {
    console.log(h);
  }
  const maxLength = HELP.map((x) => x.length)
      .reduce((a, b) => a.length > b.length ? a : b);
  return '-'.repeat(maxLength-10);
};

const version = require('../package.json').version;
topEnv['version'] = version;

module.exports = {version, HELP, help, eggExit};
