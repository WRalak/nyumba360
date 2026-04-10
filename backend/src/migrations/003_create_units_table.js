exports.up = function(knex) {
  return knex.schema.createTable('units', function(table) {
    table.increments('id').primary();
    table.string('unit_number').notNullable();
    table.integer('property_id').unsigned().references('id').inTable('properties').onDelete('CASCADE');
    table.enum('type', ['studio', '1bedroom', '2bedroom', '3bedroom', '4bedroom', 'penthouse']).notNullable();
    table.decimal('rent_amount', 10, 2).notNullable();
    table.decimal('deposit_amount', 10, 2);
    table.decimal('size', 8, 2);
    table.integer('bedrooms').defaultTo(1);
    table.integer('bathrooms').defaultTo(1);
    table.enum('status', ['available', 'occupied', 'maintenance', 'reserved']).defaultTo('available');
    table.text('description');
    table.json('features');
    table.string('floor_plan_image');
    table.string('unit_images');
    table.boolean('is_furnished').defaultTo(false);
    table.boolean('has_parking').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('units');
};
