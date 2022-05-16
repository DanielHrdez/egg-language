// let insp = require('util').inspect;
// let ins = (x) => insp(x, {depth:null});
// let exec = require('child_process').exec;
// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Testing strings', function() {
  const runTest = (programName, done) => {
    debugger;
    e2t({
      exampleInput: programName+'.egg',
      executable: 'bin/egg.js',
      assertion: (result, expected) => {
        return result.trim().should.eql(expected.trim());
      },
      done: done,
    });
  };

  it('testing string.egg', function(done) {
    runTest('string', done);
  });

  it('testing string-apply.egg', function(done) {
    runTest('string-apply', done);
  });

  it('testing string-index.egg', function(done) {
    runTest('string-index', done);
  });

  it('testing map-set-index.egg', function(done) {
    runTest('map-set-index', done);
  });
});
