var highwayCount = require('./highways');
var landuse = require('./landuse');

module.exports = function(geo) {
  if (geo.type === 'Polygon') {
    return {
    highways: highwayCount(geo),
    landuse: landuse(geo)
    }
  } else {
    return {}
  }
  
}