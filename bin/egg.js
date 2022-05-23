#!/usr/bin/env node
const {runFromFile} = require('../lib/eggvm.js');
const eggRepl = require('../lib/egg-repl');
const {version} = require('../package.json');
const {program} = require('commander');
const {parseFromFile} = require(
    '@ull-esit-pl-2122/egg-oop-parser-daniel-hernandez-de_leon-alu0101331720',
);
const fs = require('fs');
const optimize = require('../lib/optimizer');
const translate = require('../lib/translator');

const compile = (origin, destination = undefined) => {
  if (destination == undefined) {
    destination = origin.match(/^[^\.]*/)[0] + '.json';
  }
  let ast = parseFromFile(origin);
  if (program.opts().optimize) {
    ast = optimize(ast);
  }
  const astString = JSON.stringify(ast, null, 2);
  fs.writeFileSync(destination, astString);
};

program
    .version(version)
    .name('egg')
    .description('Egg Interpreter')
    .option('-c <file>', 'Compile the file')
    .option('--optimize', 'Enables Compile Optimizations')
    .option('-j, --js <file>', 'Translate to JavaScript')
    .arguments('[file]', 'Egg file to run')
    .action((file) => {
      if (program.opts().c) compile(program.opts().c, file);
      else if (program.opts().js) {
        let ast = parseFromFile(program.opts().js);
        if (program.opts().optimize) {
          ast = optimize(ast);
        }
        translate(ast, file);
      } else if (file) runFromFile(file, program.opts().optimize);
      else eggRepl(program.opts().optimize);
    });

program.parse(process.argv);
