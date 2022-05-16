// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Calling JS Methods from Egg', function() {
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

  it('testing array-properties.egg', function(done) {
    runTest('array-properties', done);
  });


  it('testing property.egg', function(done) {
    runTest('property', done);
  });

  it('testing array-set-property.egg', function(done) {
    runTest('array-set-property', done);
  });
});
