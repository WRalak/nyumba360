import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Nyumba360</h3>
          <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base px-4 sm:px-0">
            The future of property management is here. Start your journey today.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link to="/auth/register" className="text-blue-400 hover:text-blue-300 text-sm sm:text-base transition-colors">Get Started</Link>
            <Link to="/features" className="text-blue-400 hover:text-blue-300 text-sm sm:text-base transition-colors">Features</Link>
            <Link to="/demo" className="text-blue-400 hover:text-blue-300 text-sm sm:text-base transition-colors">Demo</Link>
            <Link to="/contact" className="text-blue-400 hover:text-blue-300 text-sm sm:text-base transition-colors">Contact</Link>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800 text-gray-400">
            <p className="text-xs sm:text-sm">&copy; {new Date().getFullYear()} Nyumba360. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
