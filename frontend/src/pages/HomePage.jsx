import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowRightIcon,
  StarIcon,
  CheckCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const HomePage = () => {
  const features = [
    {
      icon: BuildingOfficeIcon,
      title: 'Property Management',
      description: 'Manage multiple properties effortlessly with our comprehensive dashboard.',
      color: 'bg-blue-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Tenant Management',
      description: 'Streamline tenant onboarding, screening, and communication processes.',
      color: 'bg-green-500'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Financial Tracking',
      description: 'Track rent payments, expenses, and generate detailed financial reports.',
      color: 'bg-purple-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'AI-Powered Insights',
      description: 'Get predictive analytics and AI-powered recommendations for your properties.',
      color: 'bg-orange-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics Dashboard',
      description: 'Visualize property performance with comprehensive analytics and reporting.',
      color: 'bg-pink-500'
    },
    {
      icon: HomeIcon,
      title: 'Maintenance Management',
      description: 'Handle maintenance requests efficiently with automated workflows.',
      color: 'bg-indigo-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Property Owner',
      content: 'Nyumba360 transformed how I manage my 15 properties. The AI insights alone saved me thousands!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c2ca?w=64&h=64&fit=crop&crop=faces'
    },
    {
      name: 'Michael Chen',
      role: 'Real Estate Investor',
      content: 'The financial tracking and expense prediction features are game-changers for my investment strategy.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Property Manager',
      content: 'Managing 50+ properties is now a breeze. The tenant screening feature is incredibly accurate.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=faces'
    }
  ];

  const stats = [
    { label: 'Properties Managed', value: '10,000+', icon: BuildingOfficeIcon },
    { label: 'Happy Landlords', value: '5,000+', icon: UserGroupIcon },
    { label: 'Rent Processed', value: '$50M+', icon: CurrencyDollarIcon },
    { label: 'AI Accuracy', value: '95%', icon: ChartBarIcon }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white min-h-screen flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <img 
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&h=1080&fit=crop" 
            alt="Modern luxury house"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Transform Your
              <span className="block text-yellow-400 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Property Management</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-blue-100 max-w-4xl mx-auto px-4 sm:px-0">
              The most comprehensive rental property management platform powered by AI. 
              Manage properties, tenants, and finances with intelligent automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-0">
              <Link 
                to="/demo" 
                className="bg-yellow-400 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-xl w-full sm:w-auto"
              >
                <PlayIcon className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Watch Live Demo
              </Link>
              <Link 
                to="/auth/register" 
                className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-opacity-30 transition-all border border-white border-opacity-30 w-full sm:w-auto"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2 sm:mb-3">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm sm:text-base text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Powerful features designed to streamline your property management workflow
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 sm:mb-6`}>
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Showcase */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Beautiful Properties, Smart Management
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              From cozy apartments to luxury villas, manage any type of property with ease
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="relative rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
              <img 
                src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop" 
                alt="Modern apartment"
                className="w-full h-48 sm:h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Modern Apartments</h3>
                <p className="text-xs sm:text-sm opacity-90">Urban living with smart amenities</p>
              </div>
            </div>
            
            <div className="relative rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop" 
                alt="Luxury villa"
                className="w-full h-48 sm:h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Luxury Villas</h3>
                <p className="text-xs sm:text-sm opacity-90">Premium properties for premium clients</p>
              </div>
            </div>
            
            <div className="relative rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
              <img 
                src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&h=300&fit=crop" 
                alt="Family house"
                className="w-full h-48 sm:h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Family Homes</h3>
                <p className="text-xs sm:text-sm opacity-90">Perfect spaces for growing families</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Property Managers Worldwide
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              See what our customers have to say about their experience
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 sm:p-8 rounded-xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarSolidIcon key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 sm:mb-6 italic text-sm sm:text-base">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100 px-4 sm:px-0">
            Join thousands of property managers who have already streamlined their operations with Nyumba360
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-0">
            <Link 
              to="/auth/register" 
              className="bg-yellow-400 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-xl w-full sm:w-auto"
            >
              Start Your Free Trial
              <ArrowRightIcon className="inline-block ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link 
              to="/demo" 
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-opacity-30 transition-all border border-white border-opacity-30 w-full sm:w-auto"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
                Why Choose Nyumba360?
              </h2>
              <div className="space-y-4 sm:space-y-6">
                {[
                  'AI-powered expense predictions and maintenance scheduling',
                  'Automated rent collection with multiple payment options',
                  'Comprehensive tenant screening and background checks',
                  'Real-time financial reporting and analytics',
                  'Mobile-responsive design for on-the-go management',
                  'Secure cloud storage with automated backups'
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5 sm:mt-1" />
                    <span className="text-gray-700 text-sm sm:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <img 
                src="https://images.unsplash.com/photo-1564013799919-600baff544ff?w=600&h=400&fit=crop" 
                alt="Property management dashboard"
                className="rounded-xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 bg-yellow-400 text-gray-900 p-3 sm:p-4 rounded-xl shadow-xl">
                <div className="text-xl sm:text-2xl font-bold">95%</div>
                <div className="text-xs sm:text-sm">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      </div>
  );
};

export default HomePage;
