import { FaUserCircle, FaBars, FaSignOutAlt } from 'react-icons/fa';

function Header({ user, onMenuToggle, onLogout }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#d7263d] via-[#a91d3a] to-[#232946] shadow border-b border-[#232946]">
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuToggle}
        className="lg:hidden text-white hover:text-red-200 transition-colors p-2"
        aria-label="Toggle menu"
      >
        <FaBars className="text-xl" />
      </button>

      {/* User Info */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 lg:flex-none">
        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-red-200 flex items-center justify-center text-lg sm:text-2xl font-bold text-red-800 shadow">
          {user?.name ? user.name[0].toUpperCase() : <FaUserCircle />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm sm:text-lg text-white font-sans tracking-wide truncate">
            {user?.name || 'User'}
          </div>
          <div className="text-xs text-red-200 font-mono truncate hidden sm:block">
            {user?.email}
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d7263d] text-white hover:from-[#d7263d] hover:to-[#ff1744] shadow-lg transition-all font-semibold text-sm"
        aria-label="Logout"
      >
        <FaSignOutAlt className="text-sm" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
  );
}

export default Header; 