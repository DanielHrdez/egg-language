const specialForms_ = new Map;
const topEnv_ = new Map;
const readFileSync = require('fs').readFileSync;
const path = require('path');
let accessToken;
/* ... load other libraries ... */

topEnv_['setToken'] = function(token_) {
  try {
    if (token_) {
      return accessToken = readFileSync(token_);
    } else if (accessToken = process.env['egggithubtoken']) {
      return accessToken;
    }
    const eggConfig = require(
        path.join(
            require('os').homedir(), '.egg', 'config.json',
        ),
    );
    return accessToken = eggConfig.github.token;
  } catch (e) {
    console.error(`
        Go to https://github.com/settings/tokens and get a token for
        GitHub Egg. Save it in the Egg config file 
        '~/.egg/config.json' as the entry 'github.token' 
        or in a file and provide its name calling 'setToken(fileName)'
        or save it in a environment variable with name 'egggithubtoken'
        `);
    process.exit(1);
  }
};

// topEnv_['org'] = function (org_) {
//   ... // request to GitHub API asking for org info
// }

// topEnv_['whoami'] = function () {
//   ...
// }

// topEnv_['members'] = function (org_) {
//   ... // request to GitHub API
// }

// topEnv_['collaborators'] = function (org_) {
//   ...
// }

// topEnv_['names'] = function (array) {
//   ...
// }

// try {
//   topEnv_['setToken']();
// } catch(e) {
//    // nothing
// }
module.exports = {topEnv_, specialForms_};
