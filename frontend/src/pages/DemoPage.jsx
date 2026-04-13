import React, { useState } from 'react';
import { 
  PlayIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const DemoPage = () => {
  const [activeDemo, setActiveDemo] = useState('dashboard');
  const [isPlaying, setIsPlaying] = useState(false);

  const demoFeatures = [
    {
      id: 'dashboard',
      title: 'Property Dashboard',
      description: 'Comprehensive overview of all your properties in one place',
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      features: [
        'Real-time property analytics',
        'Occupancy rates and trends',
        'Revenue tracking and projections',
        'Maintenance status overview',
        'Tenant satisfaction metrics'
      ],
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop'
    },
    {
      id: 'tenant',
      title: 'Tenant Management',
      description: 'Streamlined tenant onboarding and management system',
      icon: UserGroupIcon,
      color: 'bg-green-500',
      features: [
        'AI-powered tenant screening',
        'Digital lease agreements',
        'Automated rent reminders',
        'Tenant communication portal',
        'Maintenance request tracking'
      ],
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop'
    },
    {
      id: 'financial',
      title: 'Financial Management',
      description: 'Complete financial tracking and reporting system',
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      features: [
        'Automated rent collection',
        'Expense tracking and categorization',
        'Financial reporting and analytics',
        'Tax preparation assistance',
        'Budget planning tools'
      ],
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop'
    },
    {
      id: 'maintenance',
      title: 'Maintenance Management',
      description: 'Efficient maintenance request and tracking system',
      icon: Cog6ToothIcon,
      color: 'bg-orange-500',
      features: [
        'Online maintenance requests',
        'Vendor management system',
        'Automated scheduling',
        'Cost tracking and approval',
        'Preventive maintenance planning'
      ],
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    },
    {
      id: 'ai',
      title: 'AI-Powered Insights',
      description: 'Advanced analytics and predictive intelligence',
      icon: ChartBarIcon,
      color: 'bg-pink-500',
      features: [
        'Expense prediction algorithms',
        'Maintenance scheduling optimization',
        'Market trend analysis',
        'Investment opportunity identification',
        'Risk assessment tools'
      ],
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop'
    },
    {
      id: 'reports',
      title: 'Advanced Reporting',
      description: 'Comprehensive reporting and analytics dashboard',
      icon: DocumentTextIcon,
      color: 'bg-indigo-500',
      features: [
        'Custom report generation',
        'Data visualization tools',
        'Performance metrics tracking',
        'Comparative analysis',
        'Export capabilities'
      ],
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      features: [
        'Up to 10 properties',
        'Basic tenant management',
        'Rent collection',
        'Maintenance tracking',
        'Email support',
        'Mobile app access'
      ],
      highlighted: false
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      features: [
        'Up to 50 properties',
        'Advanced tenant screening',
        'AI-powered insights',
        'Advanced reporting',
        'Priority support',
        'API access',
        'Custom branding'
      ],
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      features: [
        'Unlimited properties',
        'Custom AI models',
        'White-label solution',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom integrations',
        'On-premise deployment option'
      ],
      highlighted: false
    }
  ];

  const testimonials = [
    {
      name: 'David Thompson',
      role: 'Property Manager, Elite Properties',
      content: 'Nyumba360 has completely transformed how we manage our portfolio. The AI insights alone have helped us increase our ROI by 23%.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces'
    },
    {
      name: 'Lisa Martinez',
      role: 'Real Estate Investor',
      content: 'The automated rent collection and tenant screening features save me hours every week. Best investment I\'ve made for my business.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c2ca?w=64&h=64&fit=crop&crop=faces'
    },
    {
      name: 'James Wilson',
      role: 'Landlord, 25+ Properties',
      content: 'The maintenance management system is incredible. I can track everything from my phone, and tenants love the convenience.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces'
    }
  ];

  const handleDemoRequest = () => {
    // Simulate demo request
    alert('Thank you for your interest! Our team will contact you within 24 hours to schedule your personalized demo.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              See Nyumba360 in Action
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Experience the future of property management with our interactive demo. 
              Explore powerful features designed to streamline your workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleDemoRequest}
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-xl"
              >
                Schedule Live Demo
                <PlayIcon className="inline-block ml-2 w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-opacity-30 transition-all border border-white border-opacity-30"
              >
                {isPlaying ? 'Pause' : 'Play'} Overview Video
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Our Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Click on any feature below to see how Nyumba360 can transform your property management
            </p>
          </div>

          {/* Feature Tabs */}
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              {demoFeatures.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveDemo(feature.id)}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                    activeDemo === feature.id 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Demo Display */}
            <div className="sticky top-24">
              {demoFeatures.map((feature) => (
                <div 
                  key={feature.id}
                  className={`${activeDemo === feature.id ? 'block' : 'hidden'}`}
                >
                  <div className="bg-gray-50 rounded-xl overflow-hidden shadow-xl">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                      <p className="text-gray-600 mb-6">{feature.description}</p>
                      <div className="space-y-3">
                        {feature.features.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={handleDemoRequest}
                        className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Try This Feature
                        <ArrowRightIcon className="inline-block ml-2 w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible pricing options designed to grow with your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index}
                className={`bg-white rounded-xl shadow-lg p-8 ${
                  plan.highlighted ? 'ring-2 ring-blue-500 transform scale-105' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleDemoRequest}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.highlighted 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Property Managers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our customers have to say about their experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarSolidIcon key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get a personalized walkthrough of how Nyumba360 can solve your specific challenges
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleDemoRequest}
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-xl"
            >
              Schedule Your Demo
              <PlayIcon className="inline-block ml-2 w-5 h-5" />
            </button>
            <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-opacity-30 transition-all border border-white border-opacity-30">
              Download Brochure
            </button>
          </div>
        </div>
      </section>

      {/* Demo Process */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Your Demo Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple 3-step process to get you started with Nyumba360
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClockIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Schedule Your Demo</h3>
              <p className="text-gray-600">Choose a convenient time and tell us about your property management needs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Personalized Walkthrough</h3>
              <p className="text-gray-600">Get a tailored demo showing exactly how Nyumba360 solves your challenges</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Start Your Trial</h3>
              <p className="text-gray-600">Begin your free trial with full access to all features and support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DemoPage;
