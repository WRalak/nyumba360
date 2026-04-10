import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { unitAPI } from '../services/api';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import UnitForm from '../components/forms/UnitForm';
import Button from '../components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/Card';
import Badge from '../components/Badge';
import { formatCurrency, getStatusColor } from '../utils/formatters';
import { UNIT_STATUS } from '../utils/constants';

const Units = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const queryClient = useQueryClient();

  // Fetch units
  const { data: unitsData, isLoading } = useQuery(
    ['units', searchTerm, statusFilter, propertyFilter],
    () => {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (propertyFilter) params.property_id = propertyFilter;
      
      // Mock data for demonstration
      return Promise.resolve({
        units: [
          {
            id: 1,
            property_id: 1,
            property_name: 'Riverside Apartments',
            unit_number: 'A-101',
            type: 'apartment',
            bedrooms: 2,
            bathrooms: 1,
            size: 850,
            rent_amount: 15000,
            status: 'occupied',
            tenant_id: 1,
            tenant_name: 'John Doe',
            lease_end: '2024-12-31',
            amenities: ['balcony', 'parking', 'storage'],
            description: 'Spacious 2-bedroom apartment in prime location'
          },
          {
            id: 2,
            property_id: 1,
            property_name: 'Riverside Apartments',
            unit_number: 'B-205',
            type: 'apartment',
            bedrooms: 3,
            bathrooms: 2,
            size: 1200,
            rent_amount: 25000,
            status: 'vacant',
            tenant_id: null,
            tenant_name: null,
            lease_end: null,
            amenities: ['balcony', 'parking', 'storage', 'gym'],
            description: 'Luxurious 3-bedroom apartment with city views'
          }
        ]
      });
    },
    {
      refetchInterval: 30000,
    }
  );

  // Create unit mutation
  const createUnitMutation = useMutation(
    unitAPI.create,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('units');
        setShowAddModal(false);
        setEditingUnit(null);
      },
    }
  );

  // Update unit mutation
  const updateUnitMutation = useMutation(
    ({ id, ...data }) => unitAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('units');
        setShowAddModal(false);
        setEditingUnit(null);
      },
    }
  );

  // Delete unit mutation
  const deleteUnitMutation = useMutation(
    unitAPI.delete,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('units');
      },
    }
  );

  const handleDeleteUnit = async (unitId) => {
    if (window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      try {
        await deleteUnitMutation.mutateAsync(unitId);
      } catch (error) {
        console.error('Delete unit error:', error);
      }
    }
  };

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setShowAddModal(true);
  };

  const units = unitsData?.units || [];

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
          <h1 className="text-2xl font-bold text-gray-900">Units</h1>
          <p className="text-gray-600">Manage property units and availability</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Unit
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="occupied">Occupied</option>
                <option value="vacant">Vacant</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Properties</option>
                <option value="1">Riverside Apartments</option>
                <option value="2">Sunset Villas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <Card key={unit.id} hover className="shadow-lg">
            <CardContent>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{unit.unit_number}</h3>
                  <p className="text-gray-600 text-sm">{unit.property_name}</p>
                  <p className="text-gray-500 text-xs mt-1">{unit.type} - {unit.bedrooms} bed, {unit.bathrooms} bath</p>
                </div>
                <Badge variant={unit.status === 'occupied' ? 'success' : unit.status === 'vacant' ? 'warning' : 'secondary'}>
                  {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{unit.size}</div>
                  <div className="text-xs text-gray-500">sq ft</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(unit.rent_amount)}</div>
                  <div className="text-xs text-gray-500">monthly</div>
                </div>
              </div>

              {unit.status === 'occupied' && unit.tenant_name && (
                <div className="mb-4 p-3 bg-green-50 rounded">
                  <div className="flex items-center text-sm">
                    <UserGroupIcon className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="font-medium text-green-900">{unit.tenant_name}</div>
                      <div className="text-green-700 text-xs">Lease ends: {unit.lease_end}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-1">
                  {unit.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" size="xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {unit.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{unit.description}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* View unit details */}}
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUnit(unit)}
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteUnit(unit.id)}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Unit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingUnit(null);
        }}
        title={editingUnit ? 'Edit Unit' : 'Add Unit'}
        size="lg"
      >
        <UnitForm
          unit={editingUnit}
          onSave={(unitData) => {
            if (editingUnit) {
              updateUnitMutation.mutate({ id: editingUnit.id, ...unitData });
            } else {
              createUnitMutation.mutate(unitData);
            }
          }}
          onCancel={() => {
            setShowAddModal(false);
            setEditingUnit(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default Units;
