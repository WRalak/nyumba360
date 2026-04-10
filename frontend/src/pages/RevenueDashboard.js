import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  CurrencyDollarIcon,
  TrendingUpIcon,
  ChartBarIcon,
  TargetIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ProgressRing = ({ value, size = 120, strokeWidth = 8, color = '#10b981' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color }}>
            {Math.round(value)}%
          </div>
          <div className="text-xs text-gray-500">of target</div>
        </div>
      </div>
    </div>
  );
};

const MillionDayCard = ({ data }) => {
  const progressColor = data.current_progress >= 100 ? '#10b981' : 
                        data.current_progress >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Million Day Target</h3>
          <p className="text-sm text-gray-500">Daily revenue goal: KES 1,000,000</p>
        </div>
        <TargetIcon className="h-8 w-8 text-purple-600" />
      </div>

      <div className="flex items-center justify-center mb-6">
        <ProgressRing value={data.current_progress} color={progressColor} />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current Revenue:</span>
          <span className="text-sm font-medium text-gray-900">
            KES {data.current_revenue?.toLocaleString() || 0}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Projected Revenue:</span>
          <span className="text-sm font-medium text-gray-900">
            KES {data.projected_revenue?.toLocaleString() || 0}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Needed for Target:</span>
          <span className="text-sm font-medium text-gray-900">
            KES {data.needed_for_target?.toLocaleString() || 0}
          </span>
        </div>

        {data.days_to_target && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Days to Target:</span>
            <span className="text-sm font-medium text-gray-900">
              {data.days_to_target}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 p-3 bg-purple-50 rounded-lg">
        <div className="flex items-center">
          <LightBulbIcon className="h-5 w-5 text-purple-600 mr-2" />
          <p className="text-sm text-purple-800">
            {data.current_progress >= 100 
              ? "Congratulations! You've achieved your million day target!"
              : data.current_progress >= 50
              ? "You're on track! Keep optimizing your revenue streams."
              : "Focus on increasing occupancy and optimizing pricing strategies."}
          </p>
        </div>
      </div>
    </div>
  );
};

const OptimizationStrategy = ({ strategy, index }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {strategy.title}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            {strategy.description}
          </p>
          <p className="text-sm text-gray-700 font-medium">
            Action: {strategy.action}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(strategy.priority)}`}>
          {strategy.priority}
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">Potential Revenue Increase:</span>
        <span className="text-sm font-bold text-green-600">
          KES {strategy.potential_increase?.toLocaleString() || 0}
        </span>
      </div>
    </div>
  );
};

const QuickAction = ({ action, index }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-3">
        <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600 mr-2" />
        <h4 className="text-sm font-semibold text-gray-900">{action.title}</h4>
      </div>
      <p className="text-xs text-gray-600 mb-2">{action.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Potential:</span>
        <span className="text-xs font-bold text-green-600">
          KES {action.potential_increase?.toLocaleString() || 0}
        </span>
      </div>
    </div>
  );
};

const RevenueDashboard = () => {
  const [selectedProperty, setSelectedProperty] = useState('');
  const { api } = useAuth();

  // Fetch properties
  const { data: propertiesData } = useQuery(
    'properties',
    async () => {
      const response = await api.get('/properties');
      return response.data;
    }
  );

  // Fetch revenue dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    ['revenueDashboard', selectedProperty],
    async () => {
      if (!selectedProperty) return null;
      const response = await api.get('/revenue/dashboard', {
        params: { property_id: selectedProperty }
      });
      return response.data;
    },
    {
      enabled: !!selectedProperty
    }
  );

  const properties = propertiesData?.properties || [];
  const dashboard = dashboardData?.data;

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
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your path to million day revenue
          </p>
        </div>
        
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a property</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedProperty ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <TargetIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Property</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a property to view revenue analytics and million day targets
          </p>
        </div>
      ) : (
        <>
          {/* Million Day Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MillionDayCard data={dashboard?.million_day_target || {}} />
            </div>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Revenue</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    KES {(dashboard?.today_revenue || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Daily earnings
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Target Progress:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(dashboard?.million_day_target?.current_progress || 0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue Gap:</span>
                    <span className="text-sm font-medium text-gray-900">
                      KES {(dashboard?.million_day_target?.needed_for_target || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboard?.quick_actions?.map((action, index) => (
                <QuickAction key={index} action={action} index={index} />
              ))}
            </div>
          </div>

          {/* Optimization Strategies */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization Strategies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboard?.optimization_strategies?.recommendations?.map((strategy, index) => (
                <OptimizationStrategy key={index} strategy={strategy} index={index} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueDashboard;
