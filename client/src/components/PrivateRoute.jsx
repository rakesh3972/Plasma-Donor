import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const location = useLocation();
  
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the appropriate dashboard based on role if unauthorized access is attempted
    const redirectPath = role === 'donor' ? '/donor/dashboard' : role === 'requester' ? '/requester/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }
  
  return children;
}

export default PrivateRoute; 