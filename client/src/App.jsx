import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DonorDashboard from './pages/DonorDashboard';
import RequesterDashboard from './pages/RequesterDashboard';
import Search from './pages/Search';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import AIChatbot from './components/AIChatbot';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute allowedRoles={['donor', 'requester']}><Dashboard /></PrivateRoute>} />
          <Route path="/donor/dashboard" element={<PrivateRoute allowedRoles={['donor']}><DonorDashboard /></PrivateRoute>} />
          <Route path="/requester/dashboard" element={<PrivateRoute allowedRoles={['requester']}><RequesterDashboard /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute allowedRoles={['requester']}><Search /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute allowedRoles={['donor', 'requester']}><Chat /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute allowedRoles={['donor', 'requester']}><Profile /></PrivateRoute>} />
          <Route path="*" element={<div className="p-8 text-center">404 Not Found</div>} />
        </Routes>
        
        {/* AI Chatbot - Available on all pages */}
        <AIChatbot />
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App; 