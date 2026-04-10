exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').unique().notNullable();
    table.string('phone').unique();
    table.string('password').notNullable();
    table.enum('role', ['admin', 'landlord', 'tenant', 'agent']).defaultTo('tenant');
    table.string('id_number').unique();
    table.string('address');
    table.string('profile_image');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
