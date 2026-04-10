import React from 'react';

const Badge = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}) => {
  const getVariantClasses = (variant) => {
    const variants = {
      primary: 'bg-airbnb-pink-light text-airbnb-pink-dark',
      secondary: 'bg-airbnb-gray-light text-airbnb-gray-dark',
      success: 'bg-airbnb-green text-airbnb-white',
      warning: 'bg-airbnb-yellow text-airbnb-white',
      danger: 'bg-airbnb-red text-airbnb-white',
      info: 'bg-airbnb-blue text-airbnb-white',
      outline: 'border border-airbnb-pink text-airbnb-pink bg-airbnb-white',
    };
    return variants[variant] || variants.primary;
  };

  const getSizeClasses = (size) => {
    const sizes = {
      xs: 'px-2 py-0.5 text-xs',
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };
    return sizes[size] || sizes.md;
  };

  const baseClasses = `
    inline-flex items-center
    font-medium
    rounded-full
    ${getVariantClasses(variant)}
    ${getSizeClasses(size)}
    ${className}
  `;

  return (
    <span className={baseClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;
