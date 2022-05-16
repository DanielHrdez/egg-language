#!/usr/bin/env node
const {runFromEVM} = require('../lib/eggvm.js');
const {program} = require('commander');
const {version} = require('../package.json');

program
    .version(version)
    .name('egg-virtual-machine')
    .description('Egg Virtual Machine')
    .arguments('[file]', 'Json file to run')
    .action((file) => {
      runFromEVM(file);
    });

program.parse(process.argv);
