import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimes, FaTachometerAlt, FaSearch, FaUser, FaSignOutAlt } from 'react-icons/fa';

function RequesterSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose(); // Close sidebar on mobile after navigation
  };

  const navItems = [
    { label: 'Dashboard', icon: <FaTachometerAlt />, path: '/requester/dashboard' },
    { label: 'Search Donors', icon: <FaSearch />, path: '/search' },
    { label: 'Profile', icon: <FaUser />, path: '/profile' },
  ];

  // Improved highlighting logic
  const isActive = (path) => {
    if (path === '/requester/dashboard') {
      return location.pathname === '/requester/dashboard';
    }
    if (path === '/search') {
      return location.pathname === '/search';
    }
    if (path === '/profile') {
      return location.pathname === '/profile';
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50
        bg-red-800 text-white w-64 h-screen p-4 flex flex-col justify-between shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-white hover:text-red-200 transition-colors"
          aria-label="Close menu"
        >
          <FaTimes className="text-xl" />
        </button>

        <div className="pt-8 lg:pt-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-white">Plasma Requester</h2>
          <nav className="space-y-2">
            {navItems.map(item => (
              <button 
                key={item.path}
                onClick={() => handleNavigation(item.path)} 
                className={`w-full text-left px-4 py-3 rounded hover:bg-red-700 transition-colors text-sm sm:text-base ${
                  isActive(item.path) 
                    ? 'bg-red-700 border-b-2 border-white' 
                    : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="w-full text-left px-4 py-3 rounded hover:bg-red-700 transition-colors text-white text-sm sm:text-base"
        >
          Logout
        </button>
      </aside>
    </>
  );
}

export default RequesterSidebar; 