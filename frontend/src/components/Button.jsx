import React from 'react';
import { forwardRef } from 'react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const getVariantClasses = (variant) => {
    const variants = {
      primary: 'bg-airbnb-pink text-airbnb-white hover:bg-airbnb-pink-dark focus:ring-airbnb-pink',
      secondary: 'bg-airbnb-gray text-airbnb-white hover:bg-airbnb-gray-dark focus:ring-airbnb-gray',
      success: 'bg-airbnb-green text-airbnb-white hover:bg-airbnb-teal focus:ring-airbnb-green',
      danger: 'bg-airbnb-red text-airbnb-white hover:bg-airbnb-red-dark focus:ring-airbnb-red',
      warning: 'bg-airbnb-yellow text-airbnb-white hover:bg-airbnb-orange focus:ring-airbnb-yellow',
      outline: 'border border-airbnb-pink text-airbnb-pink bg-airbnb-white hover:bg-airbnb-pink-light focus:ring-airbnb-pink',
      ghost: 'text-airbnb-gray hover:bg-airbnb-gray-light focus:ring-airbnb-pink',
    };
    return variants[variant] || variants.primary;
  };

  const getSizeClasses = (size) => {
    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    };
    return sizes[size] || sizes.md;
  };

  const getDisabledClasses = () => {
    if (disabled || loading) {
      return 'opacity-50 cursor-not-allowed';
    }
    return '';
  };

  const getLoadingSpinner = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      );
    }
    return null;
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${getVariantClasses(variant)}
    ${getSizeClasses(size)}
    ${getDisabledClasses()}
    ${className}
  `;

  const renderIcon = () => {
    if (Icon) {
      const iconClasses = size === 'xs' || size === 'sm' ? 'h-3 w-3' : 'h-5 w-5';
      return <Icon className={iconClasses} />;
    }
    return null;
  };

  const renderContent = () => {
    if (loading) {
      return getLoadingSpinner();
    }

    if (Icon && iconPosition === 'left') {
      return (
        <>
          {renderIcon()}
          {children && <span className="ml-2">{children}</span>}
        </>
      );
    }

    if (Icon && iconPosition === 'right') {
      return (
        <>
          {children && <span className="mr-2">{children}</span>}
          {renderIcon()}
        </>
      );
    }

    return children;
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={baseClasses}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
