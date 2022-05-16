// const insp = require('util').inspect;
// const ins = (x) => insp(x, {depth: null});
// const exec = require('child_process').exec;
// eslint-disable-next-line
const should = require('should');
const e2t = require('@ull-esit-pl/example2test');

describe('Testing Maps/Hashes', function() {
  const runTest = (programName, done) => {
    e2t({
      exampleInput: programName + '.egg',
      executable: 'bin/egg.js',
      assertion: (result, expected) => result.replace(/\s+/g, '')
          .should.eql(expected.replace(/\s+/g, '')),
      done: done,
    });
  };

  /*
   * map-attributes.egg
map-colon.egg
map-sub.egg
map.egg
*/
  it('testing map-colon.egg', function(done) {
    runTest('map-colon', done);
  });

  it('testing map-attributes.egg', function(done) {
    runTest('map-attributes', done);
  });

  it('testing map-sub.egg', function(done) {
    runTest('map-sub', done);
  });

  it('testing map.egg', function(done) {
    runTest('map', done);
  });
});
