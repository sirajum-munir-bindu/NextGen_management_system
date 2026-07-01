import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  LogIn, 
  Menu, 
  X, 
  TrendingUp, 
  UploadCloud 
} from 'lucide-react';

const Sidebar = () => {
  const { isAuthenticated, username, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/employees', name: 'Employee Performance', icon: <Users size={20} /> },
    { path: '/reports', name: 'Productivity Reports', icon: <FileText size={20} /> },
  ];

  // Admin-only links
  if (isAuthenticated) {
    menuItems.push({ path: '/admin', name: 'Admin Panel', icon: <Settings size={20} /> });
  }

  const activeClass = "flex items-center gap-3 px-4 py-3 bg-blue-900 text-white rounded-lg transition-all duration-200 shadow-md";
  const inactiveClass = "flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all duration-200";

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-brand-dark text-white px-4 flex items-center justify-between z-50 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white font-bold text-lg shadow-lg">
            NW
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">NextGen Work</h1>
            <span className="text-[10px] text-slate-400 font-medium block">Productivity Tracker</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white text-xs shadow">
              {username[0].toUpperCase()}
            </div>
          )}
          <button 
            onClick={toggleSidebar} 
            className="p-2 bg-brand-deep text-white rounded-lg shadow focus:outline-none hover:bg-blue-600 transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-64 bg-brand-dark text-white p-6 flex flex-col justify-between z-50 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        lg:translate-x-0 lg:static lg:h-screen lg:z-auto lg:shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-8 mt-2 lg:mt-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white font-bold text-xl shadow-lg">
                NW
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">NextGen Work</h1>
                <span className="text-xs text-slate-400 font-medium">Productivity Tracker</span>
              </div>
            </div>
            {/* Close button inside mobile drawer */}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile / Auth Action */}
        <div className="border-t border-slate-800 pt-4 mt-auto">
          {isAuthenticated ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white shrink-0">
                  {username[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate">{username}</p>
                  <span className="text-xs text-blue-400 font-medium">System Admin</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }} 
                className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-400 hover:bg-rose-950 hover:text-rose-200 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-md"
              onClick={() => setIsOpen(false)}
            >
              <LogIn size={18} />
              Admin Login
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
