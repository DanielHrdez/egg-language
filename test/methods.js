// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Calling JS Methods from Egg', function() {
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

  it('testing method.egg', function(done) {
    runTest('method', done);
  });


  it('testing method2.egg', function(done) {
    runTest('method2', done);
  });

  it('testing method3.egg', function(done) {
    runTest('method3', done);
  });

  it('testing method-concatenation.egg', function(done) {
    runTest('method-concatenation', done);
  });

  it('testing method-sub-patching.egg', function(done) {
    runTest('method-sub-patching', done);
  });
});
