
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto;'),
    knex.schema.createTable('aois', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('owner').notNullable();
      table.string('info').notNullable();
      table.jsonb('analysis');
      table.timestamps(true);
    })])
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('aois').then(() => {
    return knex.raw('DROP EXTENSION pgcrypto;');
  });
};
