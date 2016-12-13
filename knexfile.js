// Update with your config settings.
const config = require('./config/config');

module.exports = {

  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || config.DATABASE_URL,
    migrations: {
      tableName: 'migrations'
    }
  }

};
