// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Testing scopes', function() {
  const runTest = (programName, done) => {
    e2t({
      exampleInput: programName+'.egg',
      executable: 'bin/egg.js',
      assertion: (result, expected) => {
        return result.trim().should.eql(expected.trim());
      },
      done: done,
    });
  };

  it('testing scope.egg', function(done) {
    runTest('scope', done);
  });
});
