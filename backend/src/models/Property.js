const db = require('../config/database');

class Property {
  static async create(propertyData) {
    const [property] = await db('properties')
      .insert(propertyData)
      .returning('*');
    
    return property;
  }

  static async findById(id) {
    const property = await db('properties')
      .where({ id })
      .first();
    
    if (property) {
      // Get units for this property
      property.units = await db('rental_units')
        .where({ property_id: id })
        .orderBy('unit_number');
    }
    
    return property;
  }

  static async findByOwner(ownerId) {
    return await db('properties')
      .where({ owner_id: ownerId, is_active: true })
      .orderBy('created_at', 'desc');
  }

  static async update(id, propertyData) {
    const [property] = await db('properties')
      .where({ id })
      .update({
        ...propertyData,
        updated_at: new Date()
      })
      .returning('*');
    
    return property;
  }

  static async delete(id) {
    return await db('properties')
      .where({ id })
      .update({ 
        is_active: false, 
        updated_at: new Date() 
      });
  }

  static async getPropertyStats(propertyId) {
    const stats = await db('rental_units')
      .select(
        db.raw('COUNT(*) as total_units'),
        db.raw('COUNT(CASE WHEN is_vacant = true THEN 1 END) as vacant_units'),
        db.raw('COUNT(CASE WHEN is_vacant = false THEN 1 END) as occupied_units'),
        db.raw('SUM(monthly_rent) as total_potential_rent'),
        db.raw('SUM(CASE WHEN is_vacant = false THEN monthly_rent ELSE 0 END) as current_monthly_rent')
      )
      .where({ property_id: propertyId, is_active: true })
      .first();
    
    return stats;
  }

  static async getOccupancyRate(propertyId) {
    const stats = await this.getPropertyStats(propertyId);
    if (!stats || stats.total_units === 0) return 0;
    
    return Math.round((stats.occupied_units / stats.total_units) * 100);
  }

  static async getMonthlyIncome(propertyId, months = 12) {
    const income = await db('rent_payments')
      .select(
        db.raw('DATE_TRUNC(\'month\', payment_date) as month'),
        db.raw('SUM(amount) as total_income')
      )
      .join('lease_agreements', 'rent_payments.lease_id', 'lease_agreements.id')
      .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
      .where({
        'rental_units.property_id': propertyId,
        'rent_payments.payment_status': 'completed'
      })
      .where('rent_payments.payment_date', '>=', db.raw('NOW() - INTERVAL \'? months\'', [months]))
      .groupByRaw('DATE_TRUNC(\'month\', payment_date)')
      .orderByRaw('DATE_TRUNC(\'month\', payment_date) DESC');
    
    return income;
  }
}

module.exports = Property;
