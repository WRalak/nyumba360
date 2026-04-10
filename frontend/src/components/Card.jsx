import React from 'react';

const Card = ({ 
  children, 
  className = '',
  padding = 'md',
  hover = false,
  shadow = 'md',
  ...props 
}) => {
  const getPaddingClasses = (padding) => {
    const paddings = {
      none: '',
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };
    return paddings[padding] || paddings.md;
  };

  const getShadowClasses = (shadow) => {
    const shadows = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      '2xl': 'shadow-2xl',
    };
    return shadows[shadow] || shadows.md;
  };

  const baseClasses = `
    bg-airbnb-white
    rounded-xl
    ${getPaddingClasses(padding)}
    ${getShadowClasses(shadow)}
    ${hover ? 'hover:shadow-lg hover:border-airbnb-pink transition-all duration-200' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <h3 className={`text-lg font-semibold text-airbnb-gray-dark ${className}`} {...props}>
      {children}
    </h3>
  );
};

const CardDescription = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <p className={`text-sm text-airbnb-gray ${className}`} {...props}>
      {children}
    </p>
  );
};

const CardContent = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div className={`mt-4 pt-4 border-t border-airbnb-gray-light ${className}`} {...props}>
      {children}
    </div>
  );
};

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
