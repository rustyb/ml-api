var local = {};
try {
  local = require('./local.js');
} catch(e) {}

var _ = require('lodash');
var config = local || {};

/**
 * Server configuration.  Options here should be overridden in `local.js`.
 *
 * @name Configuration
 */
production = {
  // DATABASE_URL: 'postgres://'+process.env.DATABASE_US+':'+process.env.DATABASE_UP+'@localhost:5432/scrape',
  port: process.env.PORT || 4000,
  cache: process.env.CACHE_CONTROL ||  86400, // A day in seconds
  logOptions: local.logOptions || {
    ops: {
        interval: 1000
    },
    reporters: {
        console: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{
                log: '*',
                response: '*'
            }]
        }, {
            module: 'good-console'
        }, 'stdout']
    }
  }
}

_.defaultsDeep(config, production);
module.exports = config;