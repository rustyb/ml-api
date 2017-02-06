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
  const query = db('planet_osm_point')
      .select('amenity')
      .count('amenity')      
      .whereNotNull('amenity')
      .orderBy('amenity')
      .groupBy('amenity')

  if (geo) {
    return query.where(
        db.raw(`ST_Intersects(planet_osm_point.way, ` + 
          `(select ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(geo)}'),4326),900913) ))`)
        )
  }

  return query
}