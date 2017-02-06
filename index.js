'use strict';
const config = require('./config/config');

const Hapi = require('hapi');
const Boom = require('boom');

const GoodWinston = require('good-winston');
const winston = require('winston');
const _ = require('lodash')

/* Analysis queries to run */
var highwayCount = require('./queries/highways');
var buildings = require('./queries/buildings');
var landuse = require('./queries/landuse');
var barriers = require('./queries/barriers');
var naturalAreas = require('./queries/naturalAreas');
var amenities = require('./queries/amenities')

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

function joinAll(highways, landuse, buildings, barriers, natural, amenities) {
  return {
    highways: highways, 
    landuse: landuse, 
    buildings: buildings, 
    barriers: barriers, 
    natural: natural, 
    amenities: amenities
  }
}


/* get a single application */
server.route({
  method: 'GET',
  path: '/aois',
  handler: function (req, res) {
    return db('aois')
      .select()
      .orderBy('created_at', 'desc')
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
  path: '/aois/{id}',
  handler: function (req, res) {
    return db('aois')
      .select()
      .where('aois.id', req.params.id)
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

    var geo = data.geo.features[0].geometry

    highwayCount(geo).then(function(more) {
      return Promise.all([
          landuse(geo),
          buildings(geo),
          barriers(geo),
          naturalAreas(geo),
          amenities(geo)
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

/* Get statistics for all of Lesotho */
server.route({
  method: 'POST',
  path: '/aois/lesotho',
  handler: function (req, res) {
    
    // const data = req.payload;
    

    highwayCount().then(function(more) {
      return Promise.all([
          landuse(),
          buildings(),
          barriers(),
          naturalAreas(),
          amenities()
        ]).then(results => {
          return joinAll(more, ...results)
        }).then(analysis => {
          return db('aois')
            .returning('id')
            .insert({
              name: "Snapshot for all of Lesotho",
              owner: "RustyB",
              info: "This is a snapshot covering the entirety of Lesotho",
              search_geo: JSON.stringify({
                          type: "FeatureCollection",
                          features: []
                        }),
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