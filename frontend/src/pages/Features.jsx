import React from 'react';
import { BuildingOfficeIcon, UserGroupIcon, CurrencyDollarIcon, ChartBarIcon, ShieldCheckIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const Features = () => {
  const features = [
    {
      icon: BuildingOfficeIcon,
      title: 'Property Management',
      description: 'Manage multiple properties, track maintenance, and monitor occupancy rates.',
      color: 'blue'
    },
    {
      icon: UserGroupIcon,
      title: 'Tenant Management',
      description: 'Handle tenant applications, lease agreements, and communication efficiently.',
      color: 'green'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Payment Processing',
      description: 'Automated rent collection with M-Pesa integration and payment reminders.',
      color: 'yellow'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics & Reports',
      description: 'Get insights into your property performance with detailed reports.',
      color: 'purple'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Legal Compliance',
      description: 'Stay compliant with Kenyan rental laws and regulations.',
      color: 'red'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile Access',
      description: 'Manage your properties on the go with our mobile-responsive platform.',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Features</h1>
          <p className="text-xl text-gray-600">Everything you need to manage your properties efficiently</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className={`rounded-full p-3 w-12 h-12 mb-4 flex items-center justify-center ${getColorClasses(feature.color)}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">Join thousands of property managers who trust Nyumba360</p>
          <div className="space-x-4">
            <a 
              href="/register" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Start Free Trial
            </a>
            <a 
              href="/login" 
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
