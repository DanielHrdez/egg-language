// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Separated Compilation in Egg', function() {
  const runTest = (programName, done) => {
    debugger;
    e2t({
      exampleInput: 'require/'+programName+'.egg',
      executable: 'bin/egg.js',
      assertion: (result, expected) => {
        return result.trim().should.eql(expected.trim());
      },
      done: done,
    });
  };

  it('testing client.egg', function(done) {
    runTest('client', done);
  });
});
