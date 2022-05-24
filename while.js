/**
 * Generated with Egg translator
 * @author Daniel Hernández de León Alu0101331720
 * @version 4.8.0
 * @license MIT
 */
const libPath =
  '@ull-esit-pl-2122/tfa-daniel-hernandez-de_leon-alu0101331720/lib/';
const {runtimeSupport} = require(`${libPath}/runtime-support`);
(() => {
  let $a = 1;
  return (() => {
    let $lastWhileValue;
    while (($a < 4)) {
      $lastWhileValue = (() => {
        runtimeSupport.print($a);
        return $a = ($a + 1);
      })();
    }
    return $lastWhileValue;
  })();
})();
