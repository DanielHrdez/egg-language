// const insp = require('util').inspect;
// const ins = (x) => insp(x, {depth: null});
const fs = require('fs');
// eslint-disable-next-line
const should = require('should');
// const sinon = require('sinon');
// const testConsole = require('test-console');
// const expect = require('chai').expect;
// require('mocha-sinon');

// const assert = require('assert');
const {Value, Word, Apply} = require('../lib/ast.js');
const parser = require(
    '@ull-esit-pl-2122/egg-oop-parser-daniel-hernandez-de_leon-alu0101331720',
);
const eggvm = require('../lib/eggvm.js');
const {json2AST} = require('../lib/registry.js');

describe('parse', function() {
  it('should parse numbers and leave rest', function() {
    const value = new Value({type: 'value', value: 1});
    json2AST(parser.parse('1')).should.eql(value);
  });

  it('should parse strings', function() {
    const value = new Value({type: 'value', value: 's'});
    json2AST(parser.parse('"s"')).should.eql(value);
  });

  it('should parse word not followed by \'(\'', function() {
    const value = new Word({
      type: 'word',
      name: 'word',
      token: {type: 'WORD', value: 'word', lineno: 1, offset: 0},
    });
    json2AST(parser.parse('word')).should.eql(value);
  });

  it('should parse apply if word followed by \'(\'', function() {
    const value = new Apply({
      type: 'apply',
      operator: new Word({
        type: 'word',
        name: 'word',
        token: {type: 'WORD', value: 'word', lineno: 1, offset: 0},
      }),
      args: [
        new Word({
          type: 'word',
          name: 'a',
          token: {type: 'WORD', value: 'a', lineno: 1, offset: 7},
        }),
      ],
    });
    json2AST(parser.parse('word ( a )')).should.eql(value);
  });
});

describe('run', function() {
  let originalLog;
  let output = [];
  beforeEach(function() {
    originalLog = console.log;
    console.log = function(...args) {
      originalLog(...args);
      output.push(...args);
      return args;
    };
  });

  // test code here
  afterEach(function() {
    console.log = originalLog;
    output = [];
  });

  it('should run a complex function', function() {
    const program = `
      do(
        def(sum,  #; function
          ->(nums, 
            do(
               def(i, 0), # Creates a local constiable i and sets to 0
               def(s, 0), # Creates local const s and sets to 0
               while(<(i, length(nums)),
                 do(=(s, +(s, <-(nums, i))),
                    =(i, +(i, 1))
                 )
               ),
               s # the last expression is returned 
            )
         )
       ),
       sum(array(1, 2, 3, 4))
      )
    `;
    const r = eggvm.run(program);
    r.should.eql(10);
  });

  it('testing one.egg with mocking of console.log', function() {
    const program = fs.readFileSync('test/examples/one.egg', 'utf8');
    // eslint-disable-next-line
    const r = eggvm.run(program);
    output[0].should.eql('50');
  });

  it('testing array.egg with mocking of console.log', function() {
    const program = fs.readFileSync('test/examples/array.egg', 'utf8');
    const r = eggvm.run(program);
    r.should.eql(5);
    output.should.be.deepEqual(['[1,4]', '5']);
  });

  it('testing if.egg with mocking of console.log', function() {
    const program = fs.readFileSync('test/examples/if.egg', 'utf8');
    const r = eggvm.run(program);
    r.should.eql(5);
    output.should.be.deepEqual(['5']);
  });

  it('testing reduce.egg with mocking of console.log', function() {
    const program = fs.readFileSync('test/examples/reduce.egg', 'utf8');
    const r = eggvm.run(program);
    r.should.eql(1);
    output.should.be.deepEqual(['15', '720', '0', '1']);
  });
});
