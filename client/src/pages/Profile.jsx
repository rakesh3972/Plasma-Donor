import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';
import Header from '../components/Header';
import { getCurrentLocationWithAddress } from '../utils/geocoding';
import { FaUser, FaEnvelope, FaTint, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaArrowLeft, FaLocationArrow, FaGlobe } from 'react-icons/fa';

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    bloodGroup: '', 
    address: '', 
    lat: '', 
    lng: '' 
  });
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const navigate = useNavigate();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    api.get('/profile')
      .then(res => {
        setUser(res.data);
        setForm({
          name: res.data.name,
          bloodGroup: res.data.bloodGroup,
          address: res.data.location?.address || '',
          lat: res.data.location?.lat || '',
          lng: res.data.location?.lng || ''
        });
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load profile');
        setLoading(false);
      });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    setLocationLoading(true);
    setLocationStatus('Getting your location...');
    
    try {
      const locationData = await getCurrentLocationWithAddress();
      
      setForm(prev => ({
        ...prev,
        lat: locationData.lat,
        lng: locationData.lng,
        address: locationData.address
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
    try {
      const updated = await api.put('/profile', {
        name: form.name,
        bloodGroup: form.bloodGroup,
        location: { 
          address: form.address,
          lat: form.lat ? parseFloat(form.lat) : null,
          lng: form.lng ? parseFloat(form.lng) : null
        }
      });
      setUser(updated.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 text-gray-800">
      <ToastContainer position="top-right" autoClose={2000} />
      <Header user={user} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          className="mb-4 flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 font-semibold text-xs shadow-lg transition-all duration-200 transform hover:scale-105"
          onClick={() => {
            if (user.role === 'donor') navigate('/donor/dashboard');
            else if (user.role === 'requester') navigate('/requester/dashboard');
            else navigate('/');
          }}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-600 text-sm">Manage your personal information and location</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-white/20">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaUser className="text-red-500 text-sm" />
              Personal Information
            </h2>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-1">
                  <label className="block text-gray-700 font-semibold text-xs">
                    <FaUser className="inline mr-1 text-red-500" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                {/* Blood Group Field */}
                <div className="space-y-1">
                  <label className="block text-gray-700 font-semibold text-xs">
                    <FaTint className="inline mr-1 text-red-500" />
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-800 bg-white text-sm"
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                
                {/* Email Display (Read-only) */}
                <div className="space-y-1">
                  <label className="block text-gray-700 font-semibold text-xs">
                    <FaEnvelope className="inline mr-1 text-red-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                    disabled
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3">
                  <button 
                    type="submit" 
                    className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
                  >
                    <FaSave className="text-xs" /> Save Changes
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)} 
                    className="flex-1 flex items-center justify-center gap-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-semibold transition-all duration-200 text-sm"
                  >
                    <FaTimes className="text-xs" /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FaUser className="text-red-500 text-xs" />
                    <h3 className="font-semibold text-gray-800 text-sm">Name</h3>
                  </div>
                  <p className="text-gray-700 text-sm">{user.name}</p>
                </div>
                
                <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FaEnvelope className="text-red-500 text-xs" />
                    <h3 className="font-semibold text-gray-800 text-sm">Email</h3>
                  </div>
                  <p className="text-gray-700 text-sm">{user.email}</p>
                </div>
                
                <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FaTint className="text-red-500 text-xs" />
                    <h3 className="font-semibold text-gray-800 text-sm">Blood Group</h3>
                  </div>
                  <p className="text-gray-700 text-sm">{user.bloodGroup}</p>
                </div>
                
                <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FaUser className="text-red-500 text-xs" />
                    <h3 className="font-semibold text-gray-800 text-sm">Role</h3>
                  </div>
                  <p className="text-gray-700 text-sm capitalize">{user.role}</p>
                </div>
                
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
                >
                  <FaEdit className="text-xs" /> Edit Profile
                </button>
              </div>
            )}
          </div>
          
          {/* Location Information */}
          <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-white/20">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500 text-sm" />
              Location Settings
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                {/* Address Field */}
                <div className="space-y-1">
                  <label className="block text-gray-700 font-semibold text-xs">
                    <FaGlobe className="inline mr-1 text-red-500" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="Enter your address or city"
                  />
                </div>
                
                {/* Location Button */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
                  onClick={handleUseMyLocation}
                  disabled={locationLoading}
                >
                  <FaLocationArrow className={locationLoading ? 'animate-spin text-xs' : 'text-xs'} />
                  {locationLoading ? 'Getting Location...' : '📍 Use My Current Location'}
                </button>
                
                {/* Location Status */}
                {locationStatus && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-1 mb-1">
                      <FaMapMarkerAlt className="text-blue-500 text-xs" />
                      <span className="font-semibold text-blue-800 text-xs">Location Status</span>
                    </div>
                    <p className="text-blue-700 text-xs">{locationStatus}</p>
                  </div>
                )}
                
                {/* Manual Coordinates */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 text-xs">Manual Coordinates (Optional)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-gray-600 font-medium text-xs">Latitude</label>
                      <input
                        type="number"
                        name="lat"
                        value={form.lat}
                        onChange={handleChange}
                        step="any"
                        className="w-full px-2 py-1 border-2 border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-xs"
                        placeholder="e.g. 19.0760"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-gray-600 font-medium text-xs">Longitude</label>
                      <input
                        type="number"
                        name="lng"
                        value={form.lng}
                        onChange={handleChange}
                        step="any"
                        className="w-full px-2 py-1 border-2 border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-xs"
                        placeholder="e.g. 72.8777"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FaGlobe className="text-blue-500 text-xs" />
                    <h3 className="font-semibold text-gray-800 text-sm">Address</h3>
                  </div>
                  <p className="text-gray-700 text-sm">{user.location?.address || 'Not set'}</p>
                </div>
                
                {user.location?.lat && user.location?.lng && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <FaMapMarkerAlt className="text-blue-500 text-xs" />
                      <h3 className="font-semibold text-gray-800 text-sm">Coordinates</h3>
                    </div>
                    <p className="text-gray-700 text-xs">
                      {user.location.lat.toFixed(4)}, {user.location.lng.toFixed(4)}
                    </p>
                  </div>
                )}
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-xs">
                    Location helps donors and requesters find each other more easily
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile; 