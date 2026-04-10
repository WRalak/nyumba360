const db = require('../config/database');

class Unit {
  static async create(unitData) {
    const [unit] = await db('rental_units')
      .insert(unitData)
      .returning('*');
    
    // Update property total_units count
    await this.updatePropertyUnitCount(unitData.property_id);
    
    return unit;
  }

  static async findById(id) {
    const unit = await db('rental_units')
      .where({ id })
      .first();
    
    if (unit) {
      // Get property details
      unit.property = await db('properties')
        .where({ id: unit.property_id })
        .first();
      
      // Get current tenant if occupied
      if (!unit.is_vacant) {
        unit.current_tenant = await db('lease_agreements')
          .select('tenants.*', 'lease_agreements.lease_start_date', 'lease_agreements.lease_end_date')
          .join('tenants', 'lease_agreements.tenant_id', 'tenants.id')
          .where({
            'lease_agreements.unit_id': id,
            'lease_agreements.status': 'active'
          })
          .first();
      }
    }
    
    return unit;
  }

  static async findByProperty(propertyId) {
    return await db('rental_units')
      .where({ property_id: propertyId, is_active: true })
      .orderBy('unit_number');
  }

  static async update(id, unitData) {
    const [unit] = await db('rental_units')
      .where({ id })
      .update({
        ...unitData,
        updated_at: new Date()
      })
      .returning('*');
    
    return unit;
  }

  static async delete(id) {
    const unit = await this.findById(id);
    if (unit) {
      await db('rental_units')
        .where({ id })
        .update({ 
          is_active: false, 
          updated_at: new Date() 
        });
      
      // Update property total_units count
      await this.updatePropertyUnitCount(unit.property_id);
    }
    return true;
  }

  static async updateVacancyStatus(id, isVacant) {
    const [unit] = await db('rental_units')
      .where({ id })
      .update({
        is_vacant: isVacant,
        updated_at: new Date()
      })
      .returning('*');
    
    return unit;
  }

  static async updatePropertyUnitCount(propertyId) {
    const result = await db('rental_units')
      .where({ property_id: propertyId, is_active: true })
      .count('* as count')
      .first();
    
    await db('properties')
      .where({ id: propertyId })
      .update({
        total_units: parseInt(result.count),
        updated_at: new Date()
      });
  }

  static async getVacantUnits(propertyId = null) {
    let query = db('rental_units')
      .where({ is_vacant: true, is_active: true });
    
    if (propertyId) {
      query = query.where({ property_id: propertyId });
    }
    
    return await query
      .join('properties', 'rental_units.property_id', 'properties.id')
      .select(
        'rental_units.*',
        'properties.name as property_name',
        'properties.address as property_address'
      )
      .orderBy('properties.name', 'rental_units.unit_number');
  }

  static async getOccupiedUnits(propertyId = null) {
    let query = db('rental_units')
      .where({ is_vacant: false, is_active: true });
    
    if (propertyId) {
      query = query.where({ property_id: propertyId });
    }
    
    return await query
      .join('properties', 'rental_units.property_id', 'properties.id')
      .join('lease_agreements', 'rental_units.id', 'lease_agreements.unit_id')
      .join('tenants', 'lease_agreements.tenant_id', 'tenants.id')
      .select(
        'rental_units.*',
        'properties.name as property_name',
        'tenants.first_name',
        'tenants.last_name',
        'tenants.phone',
        'lease_agreements.monthly_rent',
        'lease_agreements.lease_end_date'
      )
      .where('lease_agreements.status', 'active')
      .orderBy('properties.name', 'rental_units.unit_number');
  }
}

module.exports = Unit;
