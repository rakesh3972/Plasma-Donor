import { FaTachometerAlt, FaUser, FaSearch, FaComments, FaSignOutAlt, FaTint } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ onLogout }) {
  const location = useLocation();
  // Get lastChatUserId from localStorage (set this when navigating to chat)
  const lastChatUserId = localStorage.getItem('lastChatUserId');
  const navItems = [
    { label: 'Dashboard', icon: <FaTachometerAlt />, to: '/dashboard' },
    { label: 'Profile', icon: <FaUser />, to: '/profile' },
    { label: 'Search', icon: <FaSearch />, to: '/search' },
  ];
  if (lastChatUserId) {
    navItems.push({ label: 'Chat', icon: <FaComments />, to: `/chat/${lastChatUserId}` });
  }
  
  // Improved highlighting logic
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/donor/dashboard' || location.pathname === '/requester/dashboard';
    }
    if (path === '/profile') {
      return location.pathname === '/profile';
    }
    if (path === '/search') {
      return location.pathname === '/search';
    }
    if (path.startsWith('/chat/')) {
      return location.pathname.startsWith('/chat/');
    }
    return location.pathname === path;
  };

  return (
    <aside className="sticky top-0 h-screen w-64 bg-gradient-to-b from-[#d7263d] via-[#a91d3a] to-[#232946] shadow-xl flex flex-col">
      <div className="p-6 text-2xl font-bold text-[#d7263d] flex items-center gap-2 tracking-wide">
        <FaTint className="text-[#ff1744]" /> Plasma Donor
      </div>
      <nav className="flex-1 mt-2">
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.to}>
              <Link 
                to={item.to} 
                className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all font-medium hover:bg-[#ff1744]/30 hover:text-[#d7263d] ${
                  isActive(item.to) 
                    ? 'bg-[#ff1744]/60 text-white shadow-md border-b-2 border-white' 
                    : 'text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <button onClick={onLogout} className="flex items-center gap-3 px-6 py-3 m-4 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d7263d] text-white hover:from-[#d7263d] hover:to-[#ff1744] shadow-lg transition-all font-semibold">
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
}

export default Sidebar; 