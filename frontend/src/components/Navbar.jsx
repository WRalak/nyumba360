import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-bold text-primary hover:text-primary-dark transition-colors">
              Nyumba360
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">Dashboard</Link>
                <Link to="/properties" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">Properties</Link>
                <Link to="/tenants" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">Tenants</Link>
                <Link to="/payments" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">Payments</Link>
                <Link to="/maintenance" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">Maintenance</Link>
                <Link to="/settings" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">Settings</Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 hidden lg:block">Welcome, {user?.firstName || user?.email}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-primary text-white px-3 py-1 rounded text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/about" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">About</Link>
                <Link to="/features" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">Features</Link>
                <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base">Contact</Link>
                <Link to="/login" className="text-primary border border-primary px-3 lg:px-4 py-1 lg:py-2 rounded text-sm font-medium hover:bg-primary-light transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="bg-primary text-white px-3 lg:px-4 py-1 lg:py-2 rounded text-sm font-medium hover:bg-primary-dark transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary focus:outline-none"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    Dashboard
                  </Link>
                  <Link to="/properties" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    Properties
                  </Link>
                  <Link to="/tenants" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    Tenants
                  </Link>
                  <Link to="/payments" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    Payments
                  </Link>
                  <Link to="/maintenance" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    Maintenance
                  </Link>
                  <Link to="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    Settings
                  </Link>
                  <div className="px-3 py-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Welcome, {user?.firstName || user?.email}</div>
                    <button
                      onClick={handleLogout}
                      className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-dark transition-colors w-full"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    About
                  </Link>
                  <Link to="/features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    Features
                  </Link>
                  <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                    Contact
                  </Link>
                  <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-primary border border-primary hover:bg-primary-light">
                    Sign In
                  </Link>
                  <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium bg-primary text-white hover:bg-primary-dark">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
