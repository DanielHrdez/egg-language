// let insp = require('util').inspect;
// let ins = (x) => insp(x, {depth:null});
// let exec = require('child_process').exec;
// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Testing set: Assigments', function() {
  const runTest = (programName, done) => {
    debugger;
    e2t({
      exampleInput: programName+'.egg',
      executable: 'bin/egg.js',
      assertion: (result, expected) => result.replace(/\s+/g, '').
          should.eql(expected.replace(/\s+/g, '')),

      done: done,
    });
  };

  it('testing set-simple.egg', function(done) {
    runTest('set-simple', done);
  });

  it('testing one.egg', function(done) {
    runTest('one', done);
  });

  it('testing array-set-index.egg', function(done) {
    runTest('array-set-index', done);
  });

  it('testing set-array-negative.egg', function(done) {
    runTest('set-array-negative', done);
  });

  it('testing map-set-index.egg', function(done) {
    runTest('map-set-index', done);
  });

  it('testing leftvalue.egg', function(done) {
    runTest('leftvalue', done);
  });
});
