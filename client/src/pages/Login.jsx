import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.user.role);
      localStorage.setItem('userId', response.data.user.id);
      toast.success('Login successful!');
      
      // Redirect based on user role
      if (response.data.user.role === 'donor') {
        navigate('/donor/dashboard');
      } else if (response.data.user.role === 'requester') {
        navigate('/requester/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{
      backgroundImage: `url('https://imgs.search.brave.com/RFJctSRx5mAIhxiStM-q2pSCGv05gi1BRGA1WaTVTrs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9pbWFnZS1w/aG90by9kcm9wcy1y/ZWQtYmxvb2Qtb24t/d2hpdGUtMjYwbnct/NTg2NDA4OTg1Lmpw/Zw'), linear-gradient(135deg, rgba(239, 246, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(254, 242, 242, 0.9) 100%)`,
      backgroundSize: 'cover, cover',
      backgroundPosition: 'center, center',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundBlendMode: 'overlay'
    }}>
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
      <div className="hidden lg:flex lg:w-1/2 text-white p-8 flex-col justify-center relative overflow-hidden">
        {/* Doctor Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://imgs.search.brave.com/T61PmRBMpcXsTAlSAvahHR8lUR1aLLl1ktNPycmDc0Y/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvcHJldmll/dy0xeC83My81MS9z/dGFuZGluZy1kb2N0/b3Itd29tYW4td2l0/aC1jcm9zc2VkLWFy/bXMtdmVjdG9yLTQ5/ODg3MzUxLmpwZw')`
          }}
        />
        
        {/* Red Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/80 via-red-700/85 to-red-800/90"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-24 h-24 border-2 border-red-300 rounded-full animate-ping"></div>
          <div className="absolute bottom-16 right-16 w-20 h-20 border-2 border-red-200 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 border-2 border-red-400 rounded-full animate-bounce"></div>
        </div>

        <div className="max-w-sm mx-auto text-center relative z-10">
          {/* Animated Heart Icon with Glow */}
          <div className="mb-6">
            <div className="inline-block animate-pulse relative">
              <div className="absolute inset-0 bg-red-400 rounded-full blur-lg opacity-50 animate-ping"></div>
              <svg className="w-16 h-16 text-red-200 relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          
          {/* Gradient Text Effect */}
          <h1 className="text-2xl font-bold mb-2 animate-fade-in bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent">
            Welcome to
          </h1>
          <h2 className="text-3xl font-bold mb-4 text-red-200 animate-slide-in drop-shadow-lg">
            Plasma Donor
          </h2>
          
          {/* Animated Description with Typing Effect */}
          <p className="text-sm text-red-100 mb-6 animate-fade-in-delay leading-relaxed">
            Connect with life-saving donors and recipients. 
            <span className="block mt-1 text-red-200 font-medium">Every donation makes a difference.</span>
          </p>
          
          {/* Interactive Feature Highlights */}
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-2 animate-slide-in-delay-1 group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-2 h-2 bg-red-200 rounded-full group-hover:bg-white transition-colors duration-200"></div>
              <span className="text-xs text-red-100 group-hover:text-white transition-colors duration-200">Real-time donor matching</span>
            </div>
            <div className="flex items-center space-x-2 animate-slide-in-delay-2 group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-2 h-2 bg-red-200 rounded-full group-hover:bg-white transition-colors duration-200"></div>
              <span className="text-xs text-red-100 group-hover:text-white transition-colors duration-200">Secure chat communication</span>
            </div>
            <div className="flex items-center space-x-2 animate-slide-in-delay-3 group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-2 h-2 bg-red-200 rounded-full group-hover:bg-white transition-colors duration-200"></div>
              <span className="text-xs text-red-100 group-hover:text-white transition-colors duration-200">Location-based search</span>
            </div>
            <div className="flex items-center space-x-2 animate-slide-in-delay-4 group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-2 h-2 bg-red-200 rounded-full group-hover:bg-white transition-colors duration-200"></div>
              <span className="text-xs text-red-100 group-hover:text-white transition-colors duration-200">Blood compatibility guide</span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="animate-fade-in-delay-extra">
              <div className="text-lg font-bold text-red-200">1000+</div>
              <div className="text-xs text-red-100">Lives Saved</div>
            </div>
            <div className="animate-fade-in-delay-extra-2">
              <div className="text-lg font-bold text-red-200">500+</div>
              <div className="text-xs text-red-100">Active Donors</div>
            </div>
            <div className="animate-fade-in-delay-extra-3">
              <div className="text-lg font-bold text-red-200">24/7</div>
              <div className="text-xs text-red-100">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        {/* Additional overlay for login section */}
        <div className="absolute inset-0 bg-white bg-opacity-40 backdrop-blur-sm"></div>
        
        <div className="w-full max-w-sm relative z-10">
          {/* Mobile Welcome Text */}
          <div className="text-center mb-6 lg:hidden">
            <h1 className="text-2xl font-bold text-gray-800 mb-1 animate-fade-in">Welcome Back</h1>
            <p className="text-sm text-gray-600 animate-fade-in-delay">Sign in to your account</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-6 border border-red-100 backdrop-blur-md bg-opacity-98">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1 animate-fade-in">Sign In</h2>
              <p className="text-sm text-gray-600 animate-fade-in-delay">Access your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Enter your password"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 rounded-lg font-medium hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200 hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 