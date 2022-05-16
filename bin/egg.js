#!/usr/bin/env node
const {runFromFile} = require('../lib/eggvm.js');
const eggRepl = require('../lib/egg-repl');
const {version} = require('../package.json');
const {program} = require('commander');
const {parseFromFile} = require(
    '@ull-esit-pl-2122/egg-oop-parser-daniel-hernandez-de_leon-alu0101331720',
);
const fs = require('fs');

const compile = (origin, destination = undefined) => {
  if (destination == undefined) {
    destination = origin.match(/^[^\.]*/)[0] + '.json';
  }
  const ast = parseFromFile(origin);
  const astString = JSON.stringify(ast, null, 2);
  fs.writeFileSync(destination, astString);
};

program
    .version(version)
    .name('egg')
    .description('Egg Interpreter')
    .option('-c <file>', 'Compile the file')
    .arguments('[file]', 'Egg file to run')
    .action((file) => {
      if (program.opts().c) compile(program.opts().c);
      else if (file) runFromFile(file);
      else eggRepl();
    });

program.parse(process.argv);
