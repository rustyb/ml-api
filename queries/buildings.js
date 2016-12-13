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
return db('planet_osm_polygon')
      .select('building',
              db.raw('round(SUM(ST_Perimeter(way))::numeric, 0) as perimiter'),
              db.raw('round((AVG(ST_Area(way)))::numeric, 0) as sqm')
      )
      .count('building')
      .where(
        db.raw(`ST_Intersects(planet_osm_polygon.way, ` + 
          `(select ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(geo)}'),4326),900913) ))`)
        )
      .whereNotNull('building')
      .groupBy('building')
}