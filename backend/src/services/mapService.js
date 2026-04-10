const db = require('../config/database');

class MapService {
  static async getPropertyLocation(propertyId) {
    try {
      const property = await db('properties')
        .where({ id: propertyId })
        .first();

      if (!property || !property.latitude || !property.longitude) {
        // Use geocoding to get coordinates from address
        return await this.geocodeAddress(property.address, property.county);
      }

      return {
        latitude: property.latitude,
        longitude: property.longitude,
        address: property.address,
        county: property.county
      };
    } catch (error) {
      console.error('Get property location error:', error);
      return null;
    }
  }

  static async geocodeAddress(address, county) {
    try {
      // In production, this would use a real geocoding service like Google Maps API
      // For now, return approximate coordinates for Kenyan counties
      const countyCoordinates = {
        'Nairobi': { lat: -1.2921, lng: 36.8219 },
        'Mombasa': { lat: -4.0435, lng: 39.6682 },
        'Kisumu': { lat: -0.0917, lng: 34.7680 },
        'Nakuru': { lat: -0.3031, lng: 36.0665 },
        'Eldoret': { lat: 0.5143, lng: 35.2698 },
        'Kitale': { lat: 1.0153, lng: 35.0061 },
        'Thika': { lat: -1.0361, lng: 37.0788 },
        'Kakamega': { lat: 0.2848, lng: 34.7553 },
        'Nyeri': { lat: -0.4201, lng: 36.9517 },
        'Embu': { lat: -0.5342, lng: 37.4527 },
        'Meru': { lat: 0.0470, lng: 37.6475 },
        'Machakos': { lat: -1.5167, lng: 37.2634 },
        'Kajiado': { lat: -1.7114, lng: 36.8375 },
        'Bungoma': { lat: 0.5635, lng: 34.5605 },
        'Busia': { lat: 0.4618, lng: 34.1115 },
        'Siaya': { lat: 0.2589, lng: 34.2857 },
        'Homa Bay': { lat: -0.5180, lng: 34.4587 },
        'Migori': { lat: 1.0636, lng: 34.7807 },
        'Kilifi': { lat: -3.6325, lng: 39.8510 },
        'Lamu': { lat: -2.2714, lng: 40.9030 },
        'Tana River': { lat: -0.0233, lng: 38.2429 },
        'Garissa': { lat: -0.4529, lng: 39.6460 },
        'Wajir': { lat: 1.7471, lng: 40.0780 },
        'Mandera': { lat: 3.9374, lng: 40.1036 },
        'Marsabit': { lat: 2.2805, lng: 37.9907 },
        'Isiolo': { lat: 0.3546, lng: 37.5821 },
        'Samburu': { lat: 1.2249, lng: 36.8688 },
        'Turkana': { lat: 3.5873, lng: 35.5757 },
        'West Pokot': { lat: 1.2606, lng: 35.1247 },
        'Baringo': { lat: 0.5297, lng: 35.3700 },
        'Laikipia': { lat: 0.0230, lng: 36.7200 },
        'Nandi': { lat: 0.1978, lng: 35.0947 },
        'Uasin Gishu': { lat: 0.5227, lng: 35.2698 },
        'Trans Nzoia': { lat: 1.0406, lng: 34.7500 },
        'Elgeyo Marakwet': { lat: 0.9877, lng: 35.6370 },
        'Narok': { lat: -1.0831, lng: 35.8601 },
        'Kericho': { lat: -0.3670, lng: 35.3538 },
        'Bomet': { lat: -0.7831, lng: 35.0660 },
        'Kwale': { lat: -4.1796, lng: 39.4466 }
      };

      const coords = countyCoordinates[county] || { lat: -1.2921, lng: 36.8219 }; // Default to Nairobi
      
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        address: address,
        county: county
      };
    } catch (error) {
      console.error('Geocode address error:', error);
      return null;
    }
  }

  static async getAllPropertiesMap() {
    try {
      const properties = await db('properties')
        .where({ is_active: true })
        .select('id', 'name', 'address', 'county', 'latitude', 'longitude');

      const propertiesWithLocation = await Promise.all(
        properties.map(async (property) => {
          let location = {
            latitude: property.latitude,
            longitude: property.longitude
          };

          if (!property.latitude || !property.longitude) {
            const geocoded = await this.geocodeAddress(property.address, property.county);
            if (geocoded) {
              location = {
                latitude: geocoded.latitude,
                longitude: geocoded.longitude
              };
            }
          }

          return {
            ...property,
            ...location
          };
        })
      );

      return propertiesWithLocation;
    } catch (error) {
      console.error('Get all properties map error:', error);
      return [];
    }
  }

  static async getNearbyProperties(latitude, longitude, radius = 5) {
    try {
      // Calculate nearby properties within radius (in kilometers)
      const properties = await db('properties')
        .where({ is_active: true })
        .select('id', 'name', 'address', 'county', 'latitude', 'longitude');

      const nearbyProperties = properties.filter(property => {
        if (!property.latitude || !property.longitude) return false;
        
        const distance = this.calculateDistance(
          latitude, longitude,
          property.latitude, property.longitude
        );
        
        return distance <= radius;
      }).map(property => ({
        ...property,
        distance: this.calculateDistance(
          latitude, longitude,
          property.latitude, property.longitude
        )
      }));

      return nearbyProperties.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Get nearby properties error:', error);
      return [];
    }
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  static async updatePropertyLocation(propertyId, latitude, longitude) {
    try {
      await db('properties')
        .where({ id: propertyId })
        .update({
          latitude,
          longitude,
          updated_at: new Date()
        });

      return { success: true };
    } catch (error) {
      console.error('Update property location error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPropertiesByCounty(county) {
    try {
      const properties = await db('properties')
        .where({ county, is_active: true })
        .select('id', 'name', 'address', 'latitude', 'longitude');

      return properties.map(property => ({
        ...property,
        location: {
          lat: property.latitude,
          lng: property.longitude
        }
      }));
    } catch (error) {
      console.error('Get properties by county error:', error);
      return [];
    }
  }

  static async getPropertyClusters() {
    try {
      const properties = await this.getAllPropertiesMap();
      
      // Simple clustering based on county
      const clusters = {};
      
      properties.forEach(property => {
        if (!clusters[property.county]) {
          clusters[property.county] = {
            county: property.county,
            center: this.geocodeAddress('', property.county),
            properties: [],
            total_properties: 0,
            avg_rent: 0
          };
        }
        
        clusters[property.county].properties.push(property);
        clusters[property.county].total_properties++;
      });

      return Object.values(clusters);
    } catch (error) {
      console.error('Get property clusters error:', error);
      return [];
    }
  }
}

module.exports = MapService;
