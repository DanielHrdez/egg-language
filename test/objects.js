// let insp = require('util').inspect;
// let ins = (x) => insp(x, {depth:null});
// let exec = require('child_process').exec;
// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Egg Objects', function() {
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

  it('testing objects.egg', function(done) {
    runTest('objects', done);
  });

  it('testing dot-obj.egg', function(done) {
    runTest('dot-obj', done);
  });

  it('testing dot-obj-1.egg', function(done) {
    runTest('dot-obj-1', done);
  });

  it('testing dot-obj-2.egg', function(done) {
    runTest('dot-obj-2', done);
  });

  it('testing objects-set.egg', function(done) {
    runTest('objects-set', done);
  });

  it('testing objects-context.egg', function(done) {
    runTest('objects-context', done);
  });

  it('testing bind.egg', function(done) {
    runTest('bind', done);
  });
});
