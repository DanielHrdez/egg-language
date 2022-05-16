// let insp = require('util').inspect;
// let ins = (x) => insp(x, {depth: null});
// let exec = require('child_process').exec;
// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Regular Expressions in Egg', function() {
  const runTest = (programName, done) => {
    debugger;
    e2t({
      exampleInput: programName+'.egg',
      executable: 'bin/egg.js',
      assertion: (result, expected) => result.replace(/\s+/g, '')
          .should.eql(expected.replace(/\s+/g, '')),
      done: done,
    });
  };

  it('testing regexp.egg', function(done) {
    runTest('regexp', done);
  });


  it('testing regexp-simple.egg', function(done) {
    runTest('regexp-simple', done);
  });

  it('testing regexp-global.egg', function(done) {
    runTest('regexp-global', done);
  });

  it('testing regexp-escape.egg', function(done) {
    runTest('regexp-escape', done);
  });

  it('testing regexp-bracket.egg', function(done) {
    runTest('regexp-bracket', done);
  });
});
