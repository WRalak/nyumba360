exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.increments('id').primary();
    table.integer('tenant_id').unsigned().references('id').inTable('tenants').onDelete('CASCADE');
    table.integer('unit_id').unsigned().references('id').inTable('units').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.enum('payment_type', ['rent', 'deposit', 'utilities', 'maintenance', 'penalty', 'other']).notNullable();
    table.enum('payment_method', ['mpesa', 'cash', 'bank_transfer', 'cheque', 'card']).notNullable();
    table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
    table.string('transaction_id').unique();
    table.string('mpesa_reference');
    table.date('payment_date').notNullable();
    table.date('due_date');
    table.text('description');
    table.text('receipt_number');
    table.string('payment_proof');
    table.decimal('late_fee', 10, 2).defaultTo(0);
    table.boolean('is_recurring').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
