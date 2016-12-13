
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('aois', (table) => {
      table.jsonb('search_geo');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('aois', (table) => {
      table.dropColumn('search_geo')
    })
  ]);
};
