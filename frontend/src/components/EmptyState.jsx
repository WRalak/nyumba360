import React from 'react';
import { 
  DocumentTextIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const EmptyState = ({ 
  title, 
  message, 
  icon, 
  action,
  className = ''
}) => {
  const getIcon = () => {
    if (icon) return icon;
    
    // Default icon based on context
    const iconMap = {
      properties: <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />,
      tenants: <UserGroupIcon className="h-12 w-12 text-gray-400" />,
      payments: <CurrencyDollarIcon className="h-12 w-12 text-gray-400" />,
      maintenance: <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400" />,
      documents: <DocumentTextIcon className="h-12 w-12 text-gray-400" />,
      default: <FolderIcon className="h-12 w-12 text-gray-400" />,
    };
    
    return iconMap.default;
  };

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center">
        {getIcon()}
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
