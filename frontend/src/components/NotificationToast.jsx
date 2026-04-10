import React, { useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../contexts/NotificationContext';

const NotificationToast = ({ notification }) => {
  const { removeNotification } = useNotification();

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  // Auto-remove after 10 seconds for error/warning notifications
  useEffect(() => {
    if (notification.type === 'error' || notification.type === 'warning') {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.type, removeNotification]);

  return (
    <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${getBackgroundColor()} transition-all duration-300 ease-in-out`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {notification.title || notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
          </p>
          <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
            {notification.message}
          </p>
          {notification.details && (
            <details className="mt-2">
              <summary className={`text-sm cursor-pointer ${getTextColor()} opacity-75`}>
                More details
              </summary>
              <p className={`mt-1 text-xs ${getTextColor()} opacity-75 whitespace-pre-wrap`}>
                {notification.details}
              </p>
            </details>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className={`inline-flex rounded-md hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getTextColor()}`}
            onClick={() => removeNotification(notification.id)}
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
