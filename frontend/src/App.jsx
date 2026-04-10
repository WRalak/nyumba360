import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { PropertyProvider } from './contexts/PropertyContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotificationContainer from './components/NotificationContainer';
import Home from './pages/Home';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Properties from './pages/Properties.jsx';
import PropertyDetail from './pages/PropertyDetail.jsx';
import Tenants from './pages/Tenants.jsx';
import Payments from './pages/Payments.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import About from './pages/About.jsx';
import Features from './pages/Features.jsx';
import Contact from './pages/Contact.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <PropertyProvider>
          <Router>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/properties" element={
                      <ProtectedRoute>
                        <Properties />
                      </ProtectedRoute>
                    } />
                    <Route path="/properties/:id" element={
                      <ProtectedRoute>
                        <PropertyDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/tenants" element={
                      <ProtectedRoute>
                        <Tenants />
                      </ProtectedRoute>
                    } />
                    <Route path="/payments" element={
                      <ProtectedRoute>
                        <Payments />
                      </ProtectedRoute>
                    } />
                    <Route path="/maintenance" element={
                      <ProtectedRoute>
                        <Maintenance />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </main>
                <Footer />
              </div>
              <NotificationContainer />
          </Router>
        </PropertyProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
