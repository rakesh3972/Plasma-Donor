import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';
import RequesterSidebar from '../components/RequesterSidebar';
import Header from '../components/Header';

function RequesterDashboard() {
  const [requestHistory, setRequestHistory] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await api.get('/profile');
        setUser(userRes.data);
        
        const historyRes = await api.get('/donation/request-history');
        setRequestHistory(historyRes.data);
        const activeRes = await api.get('/donation/active-requests');
        setActiveRequests(activeRes.data);
        const notificationsRes = await api.get('/notifications');
        setNotifications(notificationsRes.data);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load dashboard data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchDonors = () => {
    navigate('/search');
  };

  const handleChat = (donorId) => {
    navigate(`/chat/${donorId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex bg-red-50 text-gray-800">
      <ToastContainer position="top-right" autoClose={2000} />
      <RequesterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={handleLogout} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-red-800">Requester Dashboard</h1>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <button 
              onClick={handleSearchDonors} 
              className="bg-blue-600 text-white py-3 px-6 rounded shadow-md hover:bg-blue-700 text-sm sm:text-base"
            >
              Search Donors
            </button>
          </div>
          
          {/* Active Requests */}
          <div className="mb-6 bg-white p-4 sm:p-6 rounded shadow-md border border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-700">Active Requests</h2>
            {activeRequests.length > 0 ? (
              <div className="space-y-4">
                {activeRequests.map(request => (
                  <div key={request._id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-gray-800 font-semibold">
                          Blood Group: {request.bloodGroup || 'Not specified'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Date: {new Date(request.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Status: <span className={`font-medium ${
                            request.status === 'accepted' ? 'text-green-600' : 
                            request.status === 'pending' ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </p>
                        {request.status === 'accepted' && request.donorId && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-green-800 font-semibold">✓ Confirmed by Donor</p>
                            <p className="text-gray-800">Donor: {request.donorId.name}</p>
                            <p className="text-gray-600 text-sm">Blood Group: {request.donorId.bloodGroup}</p>
                            <p className="text-gray-600 text-sm">Location: {request.donorId.location?.address || 'Not specified'}</p>
                            <button 
                              className="mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
                              onClick={() => handleChat(request.donorId._id)}
                            >
                              Chat with Donor
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No active requests at the moment.</p>
            )}
          </div>
          
          {/* Request History */}
          <div className="mb-6 bg-white p-4 sm:p-6 rounded shadow-md border border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-700">Request History</h2>
            {requestHistory.length > 0 ? (
              <div className="space-y-4">
                {requestHistory.map(request => (
                  <div key={request._id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-gray-800 font-semibold">
                          Blood Group: {request.bloodGroup || 'Not specified'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Date: {new Date(request.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Status: <span className={`font-medium ${
                            request.status === 'accepted' ? 'text-green-600' : 
                            request.status === 'pending' ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </p>
                        {request.donorDetails && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-blue-800 font-medium">Donor: {request.donorDetails.name}</p>
                            <p className="text-blue-600 text-sm">Blood Group: {request.donorDetails.bloodGroup}</p>
                            <p className="text-blue-600 text-sm">Location: {request.donorDetails.location?.address || 'Not specified'}</p>
                          </div>
                        )}
                      </div>
                      {request.status === 'accepted' && request.donorDetails && (
                        <button 
                          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
                          onClick={() => handleChat(request.donorId)}
                        >
                          Chat with Donor
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No request history yet.</p>
            )}
          </div>
          
          {/* Notifications */}
          <div className="bg-white p-4 sm:p-6 rounded shadow-md border border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-700">Notifications</h2>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div 
                    key={notification._id} 
                    className={`p-4 border rounded-lg transition-colors ${
                      notification.isRead 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${
                          notification.isRead ? 'text-gray-700' : 'text-blue-800'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm ${
                          notification.isRead ? 'text-gray-600' : 'text-blue-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="ml-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No new notifications.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default RequesterDashboard; 