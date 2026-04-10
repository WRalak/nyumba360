import React from 'react';
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: IconComponent,
  color = 'blue',
  loading = false 
}) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        border: 'border-red-200'
      },
      yellow: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-600',
        border: 'border-yellow-200'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-200'
      }
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses(color);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-start">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-full ${colorClasses.bg}`}>
            <IconComponent className={`h-6 w-6 ${colorClasses.text}`} />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm font-medium ${
                  changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {changeType === 'increase' ? (
                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

// Pre-configured stat cards
export const PropertyStatsCard = (props) => (
  <StatsCard 
    {...props} 
    icon={BuildingOfficeIcon} 
    color="blue"
  />
);

export const TenantStatsCard = (props) => (
  <StatsCard 
    {...props} 
    icon={UserGroupIcon} 
    color="green"
  />
);

export const RevenueStatsCard = (props) => (
  <StatsCard 
    {...props} 
    icon={CurrencyDollarIcon} 
    color="purple"
  />
);

export const MaintenanceStatsCard = (props) => (
  <StatsCard 
    {...props} 
    icon={WrenchScrewdriverIcon} 
    color="yellow"
  />
);

export default StatsCard;
