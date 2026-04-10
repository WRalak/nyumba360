const db = require('../config/database');

class RentPayment {
  static async create(paymentData) {
    const [payment] = await db('rent_payments')
      .insert(paymentData)
      .returning('*');
    
    return payment;
  }

  static async findById(id) {
    return await db('rent_payments')
      .where({ id })
      .first();
  }

  static async updateStatus(id, status, additionalData = {}) {
    const [payment] = await db('rent_payments')
      .where({ id })
      .update({
        payment_status: status,
        ...additionalData,
        updated_at: new Date()
      })
      .returning('*');
    
    return payment;
  }

  static async getByLease(leaseId) {
    return await db('rent_payments')
      .where({ lease_id: leaseId })
      .orderBy('payment_date', 'desc');
  }

  static async getByTenant(tenantId, limit = 12) {
    return await db('rent_payments')
      .where({ tenant_id: tenantId })
      .orderBy('payment_date', 'desc')
      .limit(limit);
  }

  static async getByProperty(propertyId, startDate, endDate) {
    return await db('rent_payments')
      .select(
        'rent_payments.*',
        'tenants.first_name',
        'tenants.last_name',
        'tenants.phone',
        'rental_units.unit_number',
        'properties.name as property_name'
      )
      .join('lease_agreements', 'rent_payments.lease_id', 'lease_agreements.id')
      .join('tenants', 'rent_payments.tenant_id', 'tenants.id')
      .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
      .join('properties', 'lease_agreements.property_id', 'properties.id')
      .where({
        'lease_agreements.property_id': propertyId,
        'rent_payments.payment_status': 'completed'
      })
      .where('rent_payments.payment_date', '>=', startDate)
      .where('rent_payments.payment_date', '<=', endDate)
      .orderBy('rent_payments.payment_date', 'desc');
  }

  static async getMonthlyStats(propertyId, year, month) {
    const stats = await db('rent_payments')
      .select(
        db.raw('COUNT(*) as total_payments'),
        db.raw('SUM(amount) as total_amount'),
        db.raw('COUNT(CASE WHEN payment_status = \'completed\' THEN 1 END) as completed_payments'),
        db.raw('COUNT(CASE WHEN payment_status = \'pending\' THEN 1 END) as pending_payments'),
        db.raw('COUNT(CASE WHEN payment_status = \'failed\' THEN 1 END) as failed_payments')
      )
      .join('lease_agreements', 'rent_payments.lease_id', 'lease_agreements.id')
      .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
      .where({
        'rental_units.property_id': propertyId
      })
      .where(db.raw('EXTRACT(YEAR FROM payment_date) = ?', [year]))
      .where(db.raw('EXTRACT(MONTH FROM payment_date) = ?', [month]))
      .first();
    
    return stats;
  }

  static async getArrearsReport(propertyId = null) {
    let query = db('lease_agreements')
      .select(
        'lease_agreements.id as lease_id',
        'lease_agreements.monthly_rent',
        'lease_agreements.rent_due_day',
        'tenants.first_name',
        'tenants.last_name',
        'tenants.phone',
        'rental_units.unit_number',
        'properties.name as property_name'
      )
      .join('tenants', 'lease_agreements.tenant_id', 'tenants.id')
      .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
      .join('properties', 'lease_agreements.property_id', 'properties.id')
      .where('lease_agreements.status', 'active');
    
    if (propertyId) {
      query = query.where('lease_agreements.property_id', propertyId);
    }
    
    const leases = await query;
    const arrearsReport = [];
    
    for (const lease of leases) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const dueDay = lease.rent_due_day;
      
      // Check if rent is overdue for current month
      const today = new Date();
      const dueDate = new Date(currentYear, currentMonth - 1, dueDay);
      const isOverdue = today > dueDate;
      
      if (isOverdue) {
        // Get payments for current month
        const paidThisMonth = await db('rent_payments')
          .where({
            lease_id: lease.lease_id,
            payment_status: 'completed'
          })
          .where(db.raw('EXTRACT(MONTH FROM payment_date) = ?', [currentMonth]))
          .where(db.raw('EXTRACT(YEAR FROM payment_date) = ?', [currentYear]))
          .sum('amount as total')
          .first();
        
        const amountPaid = paidThisMonth.total || 0;
        const arrears = lease.monthly_rent - amountPaid;
        
        if (arrears > 0) {
          arrearsReport.push({
            ...lease,
            amount_paid: amountPaid,
            arrears_amount: arrears,
            months_overdue: 1, // Simplified for MVP
            last_payment_date: await this.getLastPaymentDate(lease.lease_id)
          });
        }
      }
    }
    
    return arrearsReport;
  }

  static async getLastPaymentDate(leaseId) {
    const lastPayment = await db('rent_payments')
      .where({ 
        lease_id: leaseId, 
        payment_status: 'completed' 
      })
      .orderBy('payment_date', 'desc')
      .first();
    
    return lastPayment ? lastPayment.payment_date : null;
  }

  static async getCollectionRate(propertyId, startDate, endDate) {
    const expectedRent = await db('lease_agreements')
      .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
      .where({
        'rental_units.property_id': propertyId,
        'lease_agreements.status': 'active'
      })
      .sum('lease_agreements.monthly_rent as total_expected')
      .first();
    
    const actualCollected = await db('rent_payments')
      .join('lease_agreements', 'rent_payments.lease_id', 'lease_agreements.id')
      .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
      .where({
        'rental_units.property_id': propertyId,
        'rent_payments.payment_status': 'completed'
      })
      .where('rent_payments.payment_date', '>=', startDate)
      .where('rent_payments.payment_date', '<=', endDate)
      .sum('rent_payments.amount as total_collected')
      .first();
    
    const expected = parseFloat(expectedRent.total_expected) || 0;
    const collected = parseFloat(actualCollected.total_collected) || 0;
    
    return expected > 0 ? Math.round((collected / expected) * 100) : 0;
  }
}

module.exports = RentPayment;
