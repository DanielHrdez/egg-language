// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Testing curry', function() {
  const runTest = (programName, done) => {
    e2t({
      exampleInput: programName + '.egg',
      executable: 'bin/egg.js',
      assertion: (result, expected) => {
        return result.trim().should.eql(expected.trim());
      },
      done: done,
    });
  };

  it('testing curry-method.egg', function(done) {
    runTest('curry-method', done);
  });

  it(`testing curry-no-method.egg`, function(done) {
    runTest(`curry-no-method`, done);
  });

  it(`testing curry-no-method-cylinder-volume.egg`, function(done) {
    runTest(`curry-no-method-cylinder-volume`, done);
  });
});
