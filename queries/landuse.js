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
      .select('landuse',
              db.raw('round(SUM(ST_Perimeter(way))::numeric, 2) as m'),
              db.raw('round((sum(ST_Area(way))/10000)::numeric, 3) as hectares')
      )
      .count('landuse')
      .where(
        db.raw(`ST_Intersects(planet_osm_polygon.way, ` + 
          `(select ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(geo)}'),4326),900913) ))`)
        )
      .whereNotNull('landuse')
      .groupBy('landuse')
}