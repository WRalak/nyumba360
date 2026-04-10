import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Nyumba360</h1>
          <p className="text-xl text-gray-600">Kenya's Trusted Property Management Platform</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              To simplify property management for landlords and property managers across Kenya through innovative technology and exceptional service.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Who We Are</h2>
            <p className="text-gray-600 mb-6">
              Nyumba360 is a Kenyan-born property management platform designed to address the unique challenges of the local rental market. We understand the needs of property managers, landlords, and tenants in Kenya.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h2>
            <ul className="space-y-2 text-gray-600">
              <li> Innovation in property management</li>
              <li> Customer-centric approach</li>
              <li> Transparency and trust</li>
              <li> Local expertise with global standards</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">Kenyan-Focused</h3>
                <p className="text-gray-600">Built specifically for the Kenyan rental market</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">M-Pesa Integration</h3>
                <p className="text-gray-600">Seamless payment processing with M-Pesa</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">24/7 Support</h3>
                <p className="text-gray-600">Round-the-clock customer support</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">Data Security</h3>
                <p className="text-gray-600">Your data is protected with enterprise-grade security</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
