import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { propertyAPI, tenantAPI, paymentAPI, maintenanceAPI } from '../services/api';
import ApiTest from '../components/ApiTest';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    async () => {
      const [propertiesRes, tenantsRes, paymentsRes, maintenanceRes] = await Promise.all([
        propertyAPI.getAll(),
        tenantAPI.getAll({ stats: true }),
        paymentAPI.getStats({ period: 'month' }),
        maintenanceAPI.getAll({ status: 'pending' })
      ]);

      const properties = propertiesRes.properties || [];
      
      return {
        properties,
        stats: {
          totalProperties: properties.length,
          totalUnits: properties.reduce((sum, prop) => sum + (prop.total_units || 0), 0),
          occupiedUnits: properties.reduce((sum, prop) => sum + (prop.stats?.occupied_units || 0), 0),
          totalTenants: tenantsRes.totalTenants || 0,
          monthlyRevenue: paymentsRes.monthlyRevenue || 0,
          pendingMaintenance: maintenanceRes.length || 0,
          collectionRate: paymentsRes.collectionRate || 0
        }
      };
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const stats = dashboardData?.stats || {};

  const statCards = [
    {
      name: 'Total Properties',
      value: stats.totalProperties,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      link: '/properties'
    },
    {
      name: 'Total Units',
      value: stats.totalUnits,
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
      link: '/properties'
    },
    {
      name: 'Occupied Units',
      value: stats.occupiedUnits,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      link: '/tenants'
    },
    {
      name: 'Active Tenants',
      value: stats.totalTenants,
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
      link: '/tenants'
    },
    {
      name: 'Monthly Revenue',
      value: `KES ${stats.monthlyRevenue?.toLocaleString() || 0}`,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      link: '/payments'
    },
    {
      name: 'Pending Maintenance',
      value: stats.pendingMaintenance,
      icon: WrenchScrewdriverIcon,
      color: 'bg-red-500',
      link: '/maintenance'
    }
  ];

  const occupancyRate = stats.totalUnits > 0 
    ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) 
    : 0;

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here's an overview of your property portfolio.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 text-white ${stat.color} rounded-lg p-2`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Occupancy Rate</h3>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="text-4xl font-bold text-blue-600">{occupancyRate}%</div>
              <div className="text-sm text-gray-500 text-center mt-2">
                {stats.occupiedUnits} of {stats.totalUnits} units occupied
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rent Collection Rate</h3>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="text-4xl font-bold text-green-600">{stats.collectionRate}%</div>
              <div className="text-sm text-gray-500 text-center mt-2">This month</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.collectionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Properties */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Properties</h3>
          {dashboardData?.properties?.slice(0, 5).length > 0 ? (
            <div className="space-y-3">
              {dashboardData.properties.slice(0, 5).map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{property.name}</p>
                    <p className="text-sm text-gray-500">{property.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{property.total_units} units</p>
                    <p className="text-xs text-gray-500">
                      {property.stats?.occupied_units || 0} occupied
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No properties yet</p>
              <Link
                to="/properties"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Property
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/properties/new"
              className="flex items-center justify-center px-4 py-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Add Property</span>
            </Link>
            <Link
              to="/tenants/new"
              className="flex items-center justify-center px-4 py-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <UserGroupIcon className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-900">Add Tenant</span>
            </Link>
            <Link
              to="/payments/new"
              className="flex items-center justify-center px-4 py-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-900">Record Payment</span>
            </Link>
            <Link
              to="/maintenance/new"
              className="flex items-center justify-center px-4 py-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <WrenchScrewdriverIcon className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-900">Maintenance Request</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* API Test Section */}
      <ApiTest />
    </div>
  );
};

export default Dashboard;
