exports.up = function(knex) {
  return knex.schema.createTable('properties', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.string('address').notNullable();
    table.string('city').notNullable();
    table.string('county');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.enum('type', ['apartment', 'house', 'commercial', 'land']).notNullable();
    table.enum('status', ['available', 'occupied', 'maintenance', 'unavailable']).defaultTo('available');
    table.integer('landlord_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('total_units').defaultTo(0);
    table.decimal('total_area', 10, 2);
    table.string('property_image');
    table.json('amenities');
    table.json('nearby_facilities');
    table.boolean('is_featured').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('properties');
};
