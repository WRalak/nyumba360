import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  TargetIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const MillionDayTracker = ({ propertyId }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { api } = useAuth();

  // Fetch million day target data
  const { data: targetData, isLoading } = useQuery(
    ['millionDayTarget', propertyId],
    async () => {
      const response = await api.get('/revenue/million-day', {
        params: { property_id: propertyId }
      });
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      enabled: !!propertyId
    }
  );

  const target = targetData?.data;

  if (!propertyId || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBgColor = (progress) => {
    if (progress >= 100) return 'bg-green-100';
    if (progress >= 75) return 'bg-blue-100';
    if (progress >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getStatusIcon = (progress) => {
    if (progress >= 100) return <CheckCircleIcon className="h-5 w-5" />;
    if (progress >= 50) return <TrendingUpIcon className="h-5 w-5" />;
    return <ExclamationTriangleIcon className="h-5 w-5" />;
  };

  const getStatusMessage = (progress) => {
    if (progress >= 100) return "Congratulations! You've achieved your million day target!";
    if (progress >= 75) return "Excellent progress! You're close to your target.";
    if (progress >= 50) return "Good progress! Keep optimizing your revenue.";
    return "Focus on increasing occupancy and revenue streams.";
  };

  const progress = target?.current_progress || 0;
  const progressColor = getProgressColor(progress);
  const progressBgColor = getProgressBgColor(progress);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TargetIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Million Day Target</h3>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Progress Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Daily Progress</span>
            <span className={`text-sm font-medium ${progressColor}`}>
              {Math.round(progress)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${progressBgColor}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-full ${progressBgColor} mr-2`}>
                {getStatusIcon(progress)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  KES {(target?.current_revenue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">of KES 1,000,000</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                KES {(target?.needed_for_target || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">to go</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className={`p-3 rounded-lg ${progressBgColor} mb-4`}>
          <div className="flex items-center">
            <LightBulbIcon className={`h-4 w-4 mr-2 ${progressColor}`} />
            <p className={`text-sm ${progressColor}`}>
              {getStatusMessage(progress)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-600 mb-1">Projected Revenue</p>
            <p className="font-medium text-gray-900">
              KES {(target?.projected_revenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-600 mb-1">Days to Target</p>
            <p className="font-medium text-gray-900">
              {target?.days_to_target || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Revenue Breakdown</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Revenue:</span>
              <span className="text-sm font-medium text-gray-900">
                KES {(target?.current_revenue || 0).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Projected Revenue:</span>
              <span className="text-sm font-medium text-gray-900">
                KES {(target?.projected_revenue || 0).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Target Amount:</span>
              <span className="text-sm font-medium text-purple-600">
                KES {(target?.target || 0).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Gap:</span>
              <span className="text-sm font-medium text-red-600">
                KES {(target?.needed_for_target || 0).toLocaleString()}
              </span>
            </div>
            
            {target?.days_to_target && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estimated Days to Target:</span>
                <span className="text-sm font-medium text-blue-600">
                  {target.days_to_target} days
                </span>
              </div>
            )}
          </div>

          {/* Action Items */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions</h5>
            <div className="space-y-2">
              {progress < 50 && (
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Focus on filling vacant units immediately with competitive pricing
                  </p>
                </div>
              )}
              
              {progress >= 50 && progress < 75 && (
                <div className="flex items-start">
                  <TrendingUpIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Optimize pricing and add value-added services to increase revenue
                  </p>
                </div>
              )}
              
              {progress >= 75 && (
                <div className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Maintain high occupancy and explore premium service offerings
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MillionDayTracker;
