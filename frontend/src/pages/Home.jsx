import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BuildingOfficeIcon, UserGroupIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Welcome to Nyumba360
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Complete Rental Property Management Solution
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Property Management</h3>
                <p className="text-gray-600 mb-4">Manage your properties efficiently</p>
                <Link 
                  to="/properties" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  View Properties
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Tenant Management</h3>
                <p className="text-gray-600 mb-4">Keep track of your tenants</p>
                <Link 
                  to="/tenants" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Manage Tenants
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Financial Dashboard</h3>
                <p className="text-gray-600 mb-4">Monitor your revenue and expenses</p>
                <Link 
                  to="/dashboard" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-airbnb-pink to-airbnb-pink-dark text-airbnb-white">
        <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to Nyumba360
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Kenya's Leading Rental Property Management Platform. Streamline your property management, tenant relations, and financial operations.
            </p>
            <div className="space-x-4">
              <Link 
                to="/register" 
                className="btn-success px-6 py-3 text-lg"
              >
                Get Started
              </Link>
              <Link 
                to="/login" 
                className="btn-outline px-6 py-3 text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Nyumba360?</h2>
          <p className="text-lg text-gray-600">Everything you need to manage your rental properties efficiently</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Property Management</h3>
            <p className="text-gray-600">Manage multiple properties with ease</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tenant Management</h3>
            <p className="text-gray-600">Track tenants and lease agreements</p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Tracking</h3>
            <p className="text-gray-600">Monitor rent payments and expenses</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">Get insights into your property performance</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-gray-600 mb-8">Join thousands of property managers who trust Nyumba360</p>
            <Link 
              to="/register" 
              className="btn-primary px-8 py-3 text-lg"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
