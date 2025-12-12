import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getCurrentLocationWithAddress } from '../utils/geocoding';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    bloodGroup: '',
    role: 'donor',
    location: {
      lat: 0,
      lng: 0,
      address: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const navigate = useNavigate();

  // Create floating particles effect
  useEffect(() => {
    const createParticle = () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.3 + 0.1
    });

    const initialParticles = Array.from({ length: 15 }, createParticle);
    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: particle.y - particle.speed,
          opacity: particle.y < 0 ? 0 : particle.opacity
        })).filter(particle => particle.y > -10)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lat' || name === 'lng') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [name]: parseFloat(value) || 0 }
      }));
    } else if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, address: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    setLocationStatus('Getting your location...');
    
    try {
      const locationData = await getCurrentLocationWithAddress();
      
      setFormData(prev => ({
        ...prev,
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
          address: locationData.address
        }
      }));
      
      if (locationData.address) {
        setLocationStatus(`Location set: ${locationData.address}`);
        toast.success('Location and address set successfully!');
      } else {
        setLocationStatus(`Location set: ${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)} (Address not available)`);
        toast.success('Location set successfully! Address not available.');
      }
    } catch (error) {
      setLocationStatus('Failed to get location');
      toast.error(error.message || 'Failed to get your location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await api.post('/auth/register', registerData);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.user.role);
      localStorage.setItem('userId', response.data.user.id);
      
      toast.success('🎉 Account created successfully! Welcome to our community.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Delay redirect to show success message
      setTimeout(() => {
        // Redirect based on user role
        if (response.data.user.role === 'donor') {
          navigate('/login');
        } else if (response.data.user.role === 'requester') {
          navigate('/login');
        } else {
          navigate('/login');
        }
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex relative overflow-hidden">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-red-300 rounded-full opacity-30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animation: 'float 6s ease-in-out infinite'
            }}
          />
        ))}
      </div>

      {/* Welcome Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white p-8 flex-col justify-center relative">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-24 h-24 border-2 border-red-300 rounded-full animate-ping"></div>
          <div className="absolute bottom-16 right-16 w-20 h-20 border-2 border-red-200 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 border-2 border-red-400 rounded-full animate-bounce"></div>
        </div>

        <div className="max-w-sm mx-auto text-center relative z-10">
          {/* Animated Medical Cross Icon with Glow */}
          <div className="mb-6">
            <div className="inline-block animate-bounce relative">
              <div className="absolute inset-0 bg-red-400 rounded-full blur-lg opacity-50 animate-ping"></div>
              <svg className="w-16 h-16 text-red-200 relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z"/>
              </svg>
            </div>
          </div>
          
          {/* Gradient Text Effect */}
          <h1 className="text-2xl font-bold mb-2 animate-fade-in bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent">
            Join Our Community
          </h1>
          <h2 className="text-3xl font-bold mb-4 text-red-200 animate-slide-in drop-shadow-lg">
            Save Lives Together
          </h2>
          
          {/* Animated Description with Typing Effect */}
          <p className="text-sm text-red-100 mb-6 animate-fade-in-delay leading-relaxed">
            Become part of a network that connects donors with those in need. 
            <span className="block mt-1 text-red-200 font-medium">Your registration could save someone's life today.</span>
          </p>
          
          {/* Interactive Feature Highlights */}
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-2 animate-slide-in-delay-1 group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-2 h-2 bg-red-200 rounded-full group-hover:bg-white transition-colors duration-200"></div>
              <span className="text-xs text-red-100 group-hover:text-white transition-colors duration-200">Quick and secure registration</span>
            </div>
            <div className="flex items-center space-x-2 animate-slide-in-delay-2 group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-2 h-2 bg-red-200 rounded-full group-hover:bg-white transition-colors duration-200"></div>
              <span className="text-xs text-red-100 group-hover:text-white transition-colors duration-200">Privacy protection guaranteed</span>
            </div>
            <div className="flex items-center space-x-2 animate-slide-in-delay-3 group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-2 h-2 bg-red-200 rounded-full group-hover:bg-white transition-colors duration-200"></div>
              <span className="text-xs text-red-100 group-hover:text-white transition-colors duration-200">Connect with verified users</span>
            </div>
            <div className="flex items-center space-x-2 animate-slide-in-delay-4 group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-2 h-2 bg-red-200 rounded-full group-hover:bg-white transition-colors duration-200"></div>
              <span className="text-xs text-red-100 group-hover:text-white transition-colors duration-200">24/7 support available</span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="animate-fade-in-delay-extra">
              <div className="text-lg font-bold text-red-200">2000+</div>
              <div className="text-xs text-red-100">Members</div>
            </div>
            <div className="animate-fade-in-delay-extra-2">
              <div className="text-lg font-bold text-red-200">100%</div>
              <div className="text-xs text-red-100">Secure</div>
            </div>
            <div className="animate-fade-in-delay-extra-3">
              <div className="text-lg font-bold text-red-200">Free</div>
              <div className="text-xs text-red-100">Forever</div>
            </div>
          </div>
        </div>
      </div>

      {/* Register Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile Welcome Text */}
          <div className="text-center mb-6 lg:hidden">
            <h1 className="text-2xl font-bold text-gray-800 mb-1 animate-fade-in">Join Our Community</h1>
            <p className="text-sm text-gray-600 animate-fade-in-delay">Create your account to start helping others</p>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 backdrop-blur-sm bg-opacity-95">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1 animate-fade-in">Create Account</h2>
              <p className="text-sm text-gray-600 animate-fade-in-delay">Join our life-saving community</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="group">
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1 group-focus-within:text-red-600 transition-colors duration-200">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 group-hover:border-red-300"
                    placeholder="Enter your full name"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1 group-focus-within:text-red-600 transition-colors duration-200">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 group-hover:border-red-300"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label htmlFor="phoneNumber" className="block text-xs font-medium text-gray-700 mb-1 group-focus-within:text-red-600 transition-colors duration-200">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 group-hover:border-red-300"
                    placeholder="Enter your phone number"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group">
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1 group-focus-within:text-red-600 transition-colors duration-200">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 group-hover:border-red-300 pr-10"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1 group-focus-within:text-red-600 transition-colors duration-200">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 group-hover:border-red-300 pr-10"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group">
                  <label htmlFor="bloodGroup" className="block text-xs font-medium text-gray-700 mb-1 group-focus-within:text-red-600 transition-colors duration-200">
                    Blood Group
                  </label>
                  <div className="relative">
                    <select
                      id="bloodGroup"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 group-hover:border-red-300 appearance-none"
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="role" className="block text-xs font-medium text-gray-700 mb-1 group-focus-within:text-red-600 transition-colors duration-200">
                    I am a
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 group-hover:border-red-300 appearance-none"
                    >
                      <option value="donor">Donor</option>
                      <option value="requester">Requester</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group">
                <label htmlFor="address" className="block text-xs font-medium text-gray-700 mb-1 group-focus-within:text-red-600 transition-colors duration-200">
                  Address (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.location.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 group-hover:border-red-300"
                    placeholder="Enter your address"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Location Detection Button */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locationLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
              >
                {locationLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Getting location...
                  </div>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use My Current Location
                  </>
                )}
              </button>

              {/* Location Status */}
              {locationStatus && (
                <div className="text-xs text-gray-700 p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-semibold">📍 Location Status: </span>
                  <span>{locationStatus}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 rounded-lg font-medium hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 