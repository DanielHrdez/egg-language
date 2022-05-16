#!/usr/bin/env node
const {parseFromFile} = require(
    '@ull-esit-pl-2122/egg-oop-parser-daniel-hernandez-de_leon-alu0101331720',
);
const {program} = require('commander');
const {version} = require('../package.json');
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
    .arguments('<origin>')
    .option(
        '-o, --out <destination>', 'Path for output file. If it isn\'t ' +
        'specified the path of the origin file will be used,' +
        'changing the extension to .json',
    )
    .action((origin, options) => {
      try {
        compile(origin, options.out);
      } catch (err) {
        console.log('There was an error: ' + err.message);
      }
    });

program.parse(process.argv);
