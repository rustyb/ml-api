// Takes polygon and returns highways
const config = require('../config/config');
const db = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL || config.DATABASE_URL,
  // migrations: {
  //   tableName: 'migrations'
  // }
});

module.exports = function (geo) {
return db('planet_osm_line')
      .select('highway',
        db.raw('round(SUM(ST_Length(way)/1000)::numeric, 2) as km')
      )
      .count('highway')
      .where(db.raw(`ST_Intersects(planet_osm_line.way, (select ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(geo)}'),4326),900913) ))`))
      .whereNotNull('highway')
      .groupBy('highway')

}