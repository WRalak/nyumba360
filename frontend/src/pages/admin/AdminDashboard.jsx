import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  TrendingUpIcon,
  UserGroupIcon,
  HomeIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon, color, trend = null }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color} rounded-lg p-3`}>
          <icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend.value > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUpIcon className={`h-4 w-4 ${trend.value > 0 ? '' : 'transform rotate-180'}`} />
                  {trend.value}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const ActivityItem = ({ type, title, user, date, status }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'property': return 'bg-green-100 text-green-800';
      case 'payment': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center px-4 py-3 sm:px-6 hover:bg-gray-50">
      <div className="flex-shrink-0">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getTypeColor(type)}`}>
          {type === 'user' && <UsersIcon className="h-4 w-4" />}
          {type === 'property' && <HomeIcon className="h-4 w-4" />}
          {type === 'payment' && <CurrencyDollarIcon className="h-4 w-4" />}
          {type === 'maintenance' && <WrenchScrewdriverIcon className="h-4 w-4" />}
        </div>
      </div>
      <div className="min-w-0 flex-1 px-4 sm:px-6">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-500">{user}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-sm text-gray-500">{date}</div>
        {status && (
          <div className={`text-xs font-medium ${status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch system stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'adminStats',
    async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch system activity
  const { data: activityData } = useQuery(
    'adminActivity',
    async () => {
      const response = await api.get('/admin/activity');
      return response.data;
    },
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  // Fetch financial data
  const { data: financialData } = useQuery(
    'adminFinancials',
    async () => {
      const response = await api.get('/admin/financials');
      return response.data;
    },
    {
      refetchInterval: 300000, // Refresh every 5 minutes
    }
  );

  const stats = statsData?.stats || {};
  const activity = activityData?.activity || {};
  const financials = financialData?.financials || {};

  if (statsLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          System overview and management
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'users', 'properties', 'financials'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats.users?.total || 0}
              icon={UsersIcon}
              color="bg-blue-500"
            />
            <StatCard
              title="Properties"
              value={stats.properties?.total || 0}
              icon={BuildingOfficeIcon}
              color="bg-green-500"
            />
            <StatCard
              title="Monthly Revenue"
              value={`KES ${(stats.payments?.monthly_revenue || 0).toLocaleString()}`}
              icon={CurrencyDollarIcon}
              color="bg-yellow-500"
            />
            <StatCard
              title="Occupancy Rate"
              value={`${stats.units?.occupancy_rate || 0}%`}
              icon={ChartBarIcon}
              color="bg-purple-500"
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              
              <div className="space-y-1">
                {activity.new_users?.slice(0, 5).map((user) => (
                  <ActivityItem
                    key={user.id}
                    type="user"
                    title={`${user.first_name} ${user.last_name} registered`}
                    user={user.email}
                    date={new Date(user.created_at).toLocaleDateString()}
                    status="completed"
                  />
                ))}
                
                {activity.new_properties?.slice(0, 3).map((property) => (
                  <ActivityItem
                    key={property.id}
                    type="property"
                    title={`${property.name} added`}
                    user={`${property.owner_first_name} ${property.owner_last_name}`}
                    date={new Date(property.created_at).toLocaleDateString()}
                    status="completed"
                  />
                ))}
                
                {activity.recent_payments?.slice(0, 3).map((payment) => (
                  <ActivityItem
                    key={payment.id}
                    type="payment"
                    title={`Payment of KES ${payment.amount}`}
                    user={`${payment.first_name} ${payment.last_name}`}
                    date={new Date(payment.created_at).toLocaleDateString()}
                    status={payment.payment_status}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.users?.total || 0}</div>
                <div className="text-sm text-blue-600 mt-2">Total Users</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.users?.landlords || 0}</div>
                <div className="text-sm text-green-600 mt-2">Landlords</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.users?.tenants || 0}</div>
                <div className="text-sm text-purple-600 mt-2">Tenants</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Property Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.properties?.total || 0}</div>
                <div className="text-sm text-blue-600 mt-2">Total Properties</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.properties?.active || 0}</div>
                <div className="text-sm text-green-600 mt-2">Active Properties</div>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{stats.units?.total || 0}</div>
                <div className="text-sm text-yellow-600 mt-2">Total Units</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.units?.occupied || 0}</div>
                <div className="text-sm text-purple-600 mt-2">Occupied Units</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financials Tab */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    KES {(financials.total_revenue || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600 mt-2">Total Platform Revenue</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    KES {(stats.payments?.monthly_revenue || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600 mt-2">This Month's Revenue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          {financials.payment_methods && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
                
                <div className="space-y-3">
                  {financials.payment_methods.map((method) => (
                    <div key={method.payment_method} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium capitalize">{method.payment_method}</span>
                      <div className="text-right">
                        <div className="font-semibold">KES {parseFloat(method.total || 0).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{method.count} transactions</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
