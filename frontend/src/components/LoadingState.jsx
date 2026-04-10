import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingState = ({ 
  message = 'Loading...', 
  size = 'lg',
  fullScreen = false,
  className = ''
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <LoadingSpinner size={size} />
      <p className="mt-4 text-gray-600 text-sm">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingState;
