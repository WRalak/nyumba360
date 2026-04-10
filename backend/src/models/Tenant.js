const db = require('../config/database');

class Tenant {
  static async create(tenantData) {
    const [tenant] = await db('tenants')
      .insert(tenantData)
      .returning('*');
    
    return tenant;
  }

  static async findById(id) {
    const tenant = await db('tenants')
      .where({ id })
      .first();
    
    if (tenant) {
      // Get current lease
      tenant.current_lease = await db('lease_agreements')
        .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
        .join('properties', 'lease_agreements.property_id', 'properties.id')
        .select(
          'lease_agreements.*',
          'rental_units.unit_number',
          'rental_units.unit_type',
          'properties.name as property_name',
          'properties.address as property_address'
        )
        .where({
          'lease_agreements.tenant_id': id,
          'lease_agreements.status': 'active'
        })
        .first();
      
      // Get rent payment history
      tenant.payment_history = await db('rent_payments')
        .where({ tenant_id: id })
        .orderBy('payment_date', 'desc')
        .limit(12);
    }
    
    return tenant;
  }

  static async findByPhone(phone) {
    return await db('tenants')
      .where({ phone })
      .first();
  }

  static async findByProperty(propertyId) {
    return await db('tenants')
      .join('lease_agreements', 'tenants.id', 'lease_agreements.tenant_id')
      .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
      .select(
        'tenants.*',
        'rental_units.unit_number',
        'rental_units.unit_type',
        'lease_agreements.lease_start_date',
        'lease_agreements.lease_end_date',
        'lease_agreements.monthly_rent',
        'lease_agreements.status as lease_status'
      )
      .where({
        'lease_agreements.property_id': propertyId,
        'lease_agreements.status': 'active'
      })
      .orderBy('tenants.last_name');
  }

  static async update(id, tenantData) {
    const [tenant] = await db('tenants')
      .where({ id })
      .update({
        ...tenantData,
        updated_at: new Date()
      })
      .returning('*');
    
    return tenant;
  }

  static async getRentArrears(tenantId) {
    const lease = await db('lease_agreements')
      .where({ 
        tenant_id: tenantId, 
        status: 'active' 
      })
      .first();
    
    if (!lease) return 0;
    
    // Calculate expected rent payments
    const currentDate = new Date();
    const leaseStart = new Date(lease.lease_start_date);
    const monthsPassed = Math.floor((currentDate - leaseStart) / (1000 * 60 * 60 * 24 * 30));
    
    // Get actual payments
    const totalPaid = await db('rent_payments')
      .where({ 
        tenant_id: tenantId, 
        payment_status: 'completed' 
      })
      .sum('amount as total')
      .first();
    
    const expectedRent = monthsPassed * lease.monthly_rent;
    const arrears = expectedRent - (totalPaid.total || 0);
    
    return Math.max(0, arrears);
  }

  static async getPaymentHistory(tenantId, limit = 12) {
    return await db('rent_payments')
      .where({ tenant_id: tenantId })
      .orderBy('payment_date', 'desc')
      .limit(limit);
  }

  static async getActiveTenantsCount(propertyId = null) {
    let query = db('lease_agreements')
      .where({ status: 'active' })
      .countDistinct('tenant_id as count');
    
    if (propertyId) {
      query = query.where({ property_id: propertyId });
    }
    
    const result = await query.first();
    return parseInt(result.count);
  }

  static async searchTenants(searchTerm, landlordId) {
    return await db('tenants')
      .join('lease_agreements', 'tenants.id', 'lease_agreements.tenant_id')
      .join('properties', 'lease_agreements.property_id', 'properties.id')
      .select(
        'tenants.*',
        'properties.name as property_name',
        'rental_units.unit_number'
      )
      .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
      .where('properties.owner_id', landlordId)
      .where(function() {
        this.where('tenants.first_name', 'ILIKE', `%${searchTerm}%`)
            .orWhere('tenants.last_name', 'ILIKE', `%${searchTerm}%`)
            .orWhere('tenants.phone', 'ILIKE', `%${searchTerm}%`)
            .orWhere('tenants.email', 'ILIKE', `%${searchTerm}%`);
      })
      .orderBy('tenants.last_name');
  }
}

module.exports = Tenant;
