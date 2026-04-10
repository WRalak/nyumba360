exports.up = function(knex) {
  return knex.schema.createTable('maintenance', function(table) {
    table.increments('id').primary();
    table.integer('property_id').unsigned().references('id').inTable('properties').onDelete('CASCADE');
    table.integer('unit_id').unsigned().references('id').inTable('units').onDelete('CASCADE');
    table.integer('tenant_id').unsigned().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('reported_by').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.enum('category', ['plumbing', 'electrical', 'structural', 'hvac', 'appliance', 'pest_control', 'other']).notNullable();
    table.enum('status', ['reported', 'in_progress', 'completed', 'cancelled', 'pending_approval']).defaultTo('reported');
    table.date('reported_date').notNullable();
    table.date('scheduled_date');
    table.date('completed_date');
    table.decimal('estimated_cost', 10, 2);
    table.decimal('actual_cost', 10, 2);
    table.text('notes');
    table.string('technician_assigned');
    table.json('before_images');
    table.json('after_images');
    table.text('completion_report');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('maintenance');
};
