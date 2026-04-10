import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="navbar bg-airbnb-white text-airbnb-gray-dark shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              Nyumba360
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-airbnb-gray-dark hover:text-airbnb-pink">Dashboard</Link>
                <Link to="/properties" className="text-airbnb-gray-dark hover:text-airbnb-pink">Properties</Link>
                <Link to="/tenants" className="text-airbnb-gray-dark hover:text-airbnb-pink">Tenants</Link>
                <Link to="/payments" className="text-airbnb-gray-dark hover:text-airbnb-pink">Payments</Link>
                <Link to="/maintenance" className="text-airbnb-gray-dark hover:text-airbnb-pink">Maintenance</Link>
                <Link to="/settings" className="text-airbnb-gray-dark hover:text-airbnb-pink">Settings</Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-airbnb-gray-600">Welcome, {user?.firstName || user?.email}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-airbnb-pink text-airbnb-white px-3 py-1 rounded text-sm font-medium hover:bg-airbnb-pink-dark"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/" className="text-airbnb-gray-dark hover:text-airbnb-pink">Home</Link>
                <Link to="/about" className="text-airbnb-gray-dark hover:text-airbnb-pink">About</Link>
                <Link to="/features" className="text-airbnb-gray-dark hover:text-airbnb-pink">Features</Link>
                <Link to="/contact" className="text-airbnb-gray-dark hover:text-airbnb-pink">Contact</Link>
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn-success">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
