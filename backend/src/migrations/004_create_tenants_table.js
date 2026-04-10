exports.up = function(knex) {
  return knex.schema.createTable('tenants', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('unit_id').unsigned().references('id').inTable('units').onDelete('CASCADE');
    table.date('lease_start').notNullable();
    table.date('lease_end').notNullable();
    table.decimal('monthly_rent', 10, 2).notNullable();
    table.decimal('deposit_paid', 10, 2).defaultTo(0);
    table.enum('payment_frequency', ['monthly', 'quarterly', 'annually']).defaultTo('monthly');
    table.enum('status', ['active', 'expired', 'terminated', 'pending']).defaultTo('pending');
    table.text('lease_terms');
    table.string('emergency_contact_name');
    table.string('emergency_contact_phone');
    table.string('id_document_copy');
    table.string('employment_details');
    table.decimal('monthly_income', 10, 2);
    table.string('kra_pin');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tenants');
};
