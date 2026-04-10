import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const PropertyRow = ({ property, onView }) => {
  const getOccupancyRate = (stats) => {
    if (!stats || stats.total_units === 0) return 0;
    return Math.round((stats.occupied_units / stats.total_units) * 100);
  };

  const occupancyRate = getOccupancyRate(property.stats);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{property.name}</div>
        <div className="text-sm text-gray-500">{property.address}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{property.county}</div>
        <div className="text-sm text-gray-500">{property.estate_area}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {property.owner_first_name} {property.owner_last_name}
        </div>
        <div className="text-sm text-gray-500">{property.owner_email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{property.stats?.total_units || 0} units</div>
        <div className="text-sm text-gray-500">
          {property.stats?.occupied_units || 0} occupied, {property.stats?.vacant_units || 0} vacant
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">{occupancyRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          property.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {property.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(property.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onView(property)}
          className="text-blue-600 hover:text-blue-900"
          title="View Property"
        >
          <EyeIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
};

const PropertyManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  const queryClient = useQueryClient();
  const { api } = useAuth();

  // Fetch properties
  const { data: propertiesData, isLoading } = useQuery(
    ['adminProperties', currentPage, searchTerm, countyFilter],
    async () => {
      const params = {
        page: currentPage,
        limit: 20,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (countyFilter) params.county = countyFilter;
      
      const response = await api.get('/admin/properties', { params });
      return response.data;
    },
    {
      keepPreviousData: true,
    }
  );

  const handleViewProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCountyFilter = (e) => {
    setCountyFilter(e.target.value);
    setCurrentPage(1);
  };

  const properties = propertiesData?.properties || [];
  const pagination = propertiesData?.pagination || {};

  // Get unique counties for filter
  const counties = [...new Set(properties.map(p => p.county).filter(Boolean))].sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of all properties in the system
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{pagination.total || 0}</div>
              <div className="text-sm text-gray-600">Total Properties</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-lg p-3">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {[...new Set(properties.map(p => p.owner_id))].length}
              </div>
              <div className="text-sm text-gray-600">Property Owners</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-lg p-3">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {properties.reduce((sum, p) => sum + (p.stats?.total_units || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Units</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-lg p-3">
              <MapPinIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{counties.length}</div>
              <div className="text-sm text-gray-600">Counties Covered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <select
            value={countyFilter}
            onChange={handleCountyFilter}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Counties</option>
            {counties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>

          <div className="text-sm text-gray-500">
            Showing {properties.length} of {pagination.total || 0} properties
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="min-w-full divide-y divide-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupancy
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((property) => (
                <PropertyRow
                  key={property.id}
                  property={property}
                  onView={handleViewProperty}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage >= pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{pagination.pages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Property Detail Modal */}
      {showPropertyModal && selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setShowPropertyModal(false)}
        />
      )}
    </div>
  );
};

// Property Detail Modal Component
const PropertyDetailModal = ({ property, onClose }) => {
  const getOccupancyRate = (stats) => {
    if (!stats || stats.total_units === 0) return 0;
    return Math.round((stats.occupied_units / stats.total_units) * 100);
  };

  const occupancyRate = getOccupancyRate(property.stats);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{property.name}</h3>
              <p className="text-gray-600">{property.address}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Info */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Property Information</h4>
                <dl className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Type:</dt>
                    <dd className="text-sm font-medium text-gray-900 capitalize">{property.property_type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">County:</dt>
                    <dd className="text-sm font-medium text-gray-900">{property.county}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Estate/Area:</dt>
                    <dd className="text-sm font-medium text-gray-900">{property.estate_area || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Status:</dt>
                    <dd className="text-sm font-medium">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        property.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {property.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Added:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(property.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Owner Information</h4>
                <dl className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Name:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {property.owner_first_name} {property.owner_last_name}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Email:</dt>
                    <dd className="text-sm font-medium text-gray-900">{property.owner_email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Phone:</dt>
                    <dd className="text-sm font-medium text-gray-900">{property.owner_phone}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Unit Statistics */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Unit Statistics</h4>
                <div className="mt-2 space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">Total Units</span>
                      <span className="text-xl font-bold text-blue-900">{property.stats?.total_units || 0}</span>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Occupied</span>
                      <span className="text-xl font-bold text-green-900">{property.stats?.occupied_units || 0}</span>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-yellow-600">Vacant</span>
                      <span className="text-xl font-bold text-yellow-900">{property.stats?.vacant_units || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Occupancy Rate</h4>
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900">{occupancyRate}%</span>
                    <span className="text-sm text-gray-500">occupied</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {property.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
              <p className="text-sm text-gray-700">{property.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyManagement;
