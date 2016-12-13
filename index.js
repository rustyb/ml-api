'use strict';
const config = require('./config/config');

const Hapi = require('hapi');
const Boom = require('boom');

const GoodWinston = require('good-winston');
const winston = require('winston');
const _ = require('lodash')

var highwayCount = require('./queries/highways');
var buildings = require('./queries/buildings');
var landuse = require('./queries/landuse');
var barriers = require('./queries/barriers');


const server = new Hapi.Server({
  connections: {
    router: {
      stripTrailingSlash: true
    },
    routes: {
      cors: {
        origin: ['*'],
        additionalHeaders: ['x-requested-with']
      }
    }
  }
});

const db = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL || config.DATABASE_URL,
  // migrations: {
  //   tableName: 'migrations'
  // }
});

server.connection({port: config.port});

server.route({
      method: 'GET',
      path: '/hello',
      handler: ( request, reply ) => {
          return reply( 'Hello World!' );
      }
  });

/* get a single application */
server.route({
  method: 'GET',
  path: '/highways',
  config: {auth: false},
  handler: function (req, res) {
    return db('semo_lines')
      .select('highway',
        db.raw('round(SUM(ST_Length(way)/1000)::numeric, 2) as km')
      )
      .whereNotNull('highway')
      .groupBy('highway')
      .then((ret) => res(ret))
      .catch(function (err) {
        console.error(err);
        return res(Boom.badImplementation('Internal Server Error - Could not find data'))
      });
  }
});


function joinAll(highways, landuse, buildings, barriers) {
  // console.log(landuse, highways)

  return {highways: highways, landuse: landuse, buildings: buildings, barriers: barriers}
}
/* get a single application */
server.route({
  method: 'POST',
  path: '/lines',
  handler: function (req, res) {
    const data = req.payload;
    const geo = JSON.parse(data.geo);
    console.log(geo.type)
    if (!data || !geo) {
      return res(Boom.badData('Bad data'));
    }

    return highwayCount(geo).then(function(more) {
      return Promise.all([
        landuse(geo),
        buildings(geo)
        ]).then(results => res(joinAll(more, ...results)))
    })
    
  }
});

/* get a single application */
server.route({
  method: 'POST',
  path: '/areas',
  handler: function (req, res) {
    const data = req.payload;
    const geo = JSON.parse(data.geo);
    // const geo_string = JSON.strin
    console.log(geo.type)
    if (!data || !geo) {
      return res(Boom.badData('Bad data'));
    }

    const query = db('planet_osm_polygon')
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

    console.log(query.toSQL())

    return query
      .then((ret) => res(ret))
      .catch(function (err) {
        console.error(err);
        return res(Boom.badImplementation('Internal Server Error - Could not find data'))
      });
  }
});


/* get a single application */
server.route({
  method: 'GET',
  path: '/aois',
  handler: function (req, res) {
    return db('aois')
      .select()
      .then((ret) => res(ret))
      .catch(function (err) {
        console.error(err);
        return res(Boom.badImplementation('Internal Server Error - Could not find data'))
      });
  }
});
/* Create metadata for an application */
server.route({
  method: 'POST',
  path: '/aois',
  handler: function (req, res) {
    
    const data = req.payload;
    
    if (!data) {
      return res(Boom.badData('Bad data'));
    }

    var geo = JSON.parse(data.geo).features[0].geometry

    highwayCount(geo).then(function(more) {
      return Promise.all([
        landuse(geo),
        buildings(geo),
        barriers(geo)
        ]).then(results => {
          return joinAll(more, ...results)
        }).then(analysis => {
          return db('aois')
            .returning('id')
            .insert({
              name: data.name,
              owner: data.owner,
              info: data.info,
              search_geo: data.geo,
              analysis: JSON.stringify(analysis),
              created_at: db.fn.now(),
              updated_at: db.fn.now()
            })
            .then(function (ret) {
              return res({id: ret[0]});
            })
            .catch(function (err) {
              console.error(err);
              return res(Boom.badImplementation('Internal Server Error - Could not add data'))
            });
        })
    })

    
  }
  });

// Setup logging
var logger = new winston.Logger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      colorize: true,
      timestamp: true
    })
  ]
});

var options = {
    reporters:{
      winston: [{
        module: 'good-winston',
        args:[logger, {
           error_level: 'error'
          ,ops_level: 'debug'
          ,request_level:'debug'
          ,response_level:'info'
          ,other_level: 'info'
        }]
      }]
    }
}



server.register({
  register: require('good'),
  options: options
}, function (err) {
  return server.log(['error'], 'good load error: ' + err);
  // if (err) throw err;
});


server.start((err) => {
  if (err) { throw err}
  console.log(`Server running at: ${server.info.uri}`);
});