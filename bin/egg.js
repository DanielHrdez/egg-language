#!/usr/bin/env node
const {runFromFile} = require('../lib/eggvm.js');
const eggRepl = require('../lib/egg-repl');
const {program} = require('commander');
const {version} = require('../package.json');

program
    .version(version)
    .name('egg')
    .description('Egg Interpreter')
    .arguments('[file]', 'Egg file to run')
    .action((file) => {
      if (file) runFromFile(file);
      else eggRepl();
    });

program.parse(process.argv);
