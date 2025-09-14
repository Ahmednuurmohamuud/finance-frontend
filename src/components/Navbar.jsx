// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, User, Settings, LogOut, Menu, X, Bell, TrendingUp } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const location = useLocation();
  const isAuthenticated = typeof window !== "undefined" && !!localStorage.getItem("accessToken");


  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await api.get("/notifications/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.results || []);
    } catch (err) {
      console.error("Notification fetch failed:", err);
      toast.error("Failed to load notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshFlag]);

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await api.post("/notifications/mark_all_read/", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setRefreshFlag(prev => prev + 1);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleNotifClick = () => {
    setNotifOpen(!notifOpen);
    setAccountOpen(false);
    if (!notifOpen) markAllRead();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountOpen && !event.target.closest('.account-menu-container')) {
        setAccountOpen(false);
      }
      if (notifOpen && !event.target.closest('.notification-container')) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [accountOpen, notifOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/70">
      {/* Overlay for mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-3 relative z-50">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            FinanceTracker
          </span>
        </div>

  {/* Desktop Menu */}
  <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link 
            to="/dashboard" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/transactions" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/transactions' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            Transactions
          </Link>
          <Link 
            to="/accounts" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/accounts' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            Accounts
          </Link>
          <Link 
            to="/budgets" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/budgets' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            Budgets
          </Link>
          <Link 
            to="/recurring" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/recurring' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            Bills
          </Link>
           <Link 
            to="/categories" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/categories' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            categories
          </Link>
          <Link 
            to="/reports" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/reports' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            Reports
          </Link>

          {/* Search Bar (desktop only) */}
          <div className="ml-2 flex items-center text-sm gap-2 border border-gray-300 px-3 py-1.5 rounded-full bg-gray-50/50">
            <Search size={16} className="text-gray-500" />
            <input
              className="w-32 xl:w-40 bg-transparent outline-none placeholder-gray-500 text-sm"
              type="text"
              placeholder="Search..."
            />
          </div>

          {/* Notification Bell */}
          <div className="relative notification-container ml-2">
            <button 
              onClick={handleNotifClick}
              className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl border border-gray-200 p-3 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <Link 
                    to="/notifications" 
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    onClick={() => setNotifOpen(false)}
                  >
                    View all
                  </Link>
                </div>
                <ul className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <li className="text-gray-500 text-sm py-4 text-center">No notifications yet</li>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <li 
                        key={n.id} 
                        className={`p-3 rounded-lg border transition-colors ${n.is_read ? "bg-gray-50 border-gray-100" : "bg-blue-50 border-blue-100"}`}
                      >
                        <p className="text-sm text-gray-800">{n.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Account Menu */}
       
{isAuthenticated && (
  <div className="relative account-menu-container ml-2">
    <button 
      onClick={() => { setAccountOpen(!accountOpen); setNotifOpen(false); }}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 hover:from-indigo-200 hover:to-purple-200 transition-all"
    >
      <User size={18} />
    </button>
    
    {accountOpen && (
      <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-xl border border-gray-200 p-2 z-50">
        {/* <Link 
          to="/profile" 
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => setAccountOpen(false)}
        >
          <User size={16} /> 
          <span className="text-sm">Profile</span>
        </Link> */}
        <Link 
          to="/settings" 
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => setAccountOpen(false)}
        >
          <Settings size={16} /> 
          <span className="text-sm">Settings</span>
        </Link>
        <div className="border-t border-gray-100 my-1"></div>
        <button 
          onClick={() => { 
            localStorage.removeItem("accessToken"); 
            window.location.href = "/"; 
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} /> 
          <span className="text-sm">Logout</span>
        </button>
      </div>
    )}
  </div>
)}

        </nav>

        {/* Mobile Search and Actions */}
        <div className="flex md:hidden items-center gap-3">
          {/* Mobile Notification Bell */}
          <div className="relative notification-container">
            <button 
              onClick={handleNotifClick}
              className="p-1.5 rounded-full hover:bg-gray-100 relative transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl border border-gray-200 p-3 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <Link 
                    to="/notifications" 
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    onClick={() => setNotifOpen(false)}
                  >
                    View all
                  </Link>
                </div>
                <ul className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <li className="text-gray-500 text-sm py-4 text-center">No notifications yet</li>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <li 
                        key={n.id} 
                        className={`p-3 rounded-lg border transition-colors ${n.is_read ? "bg-gray-50 border-gray-100" : "bg-blue-50 border-blue-100"}`}
                      >
                        <p className="text-sm text-gray-800">{n.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            aria-label="Menu" 
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed top-0 left-0 right-0 w-full bg-white border-b border-gray-200 shadow-lg md:hidden z-50 animate-in slide-in-from-top duration-300" style={{maxHeight: '100vh', overflowY: 'auto'}}>
          <div className="px-5 py-4 space-y-1">
            <Link 
              to="/dashboard" 
              className={`block py-2.5 px-4 rounded-lg text-sm font-medium ${location.pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/transactions" 
              className={`block py-2.5 px-4 rounded-lg text-sm font-medium ${location.pathname === '/transactions' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMobileOpen(false)}
            >
              Transactions
            </Link>
            <Link 
              to="/accounts" 
              className={`block py-2.5 px-4 rounded-lg text-sm font-medium ${location.pathname === '/accounts' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMobileOpen(false)}
            >
              Accounts
            </Link>
            <Link 
              to="/budgets" 
              className={`block py-2.5 px-4 rounded-lg text-sm font-medium ${location.pathname === '/budgets' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMobileOpen(false)}
            >
              Budgets
            </Link>
            <Link 
              to="/recurring" 
              className={`block py-2.5 px-4 rounded-lg text-sm font-medium ${location.pathname === '/recurring' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMobileOpen(false)}
            >
              Bills
            </Link>
            <Link 
              to="/categories" 
              className={`block py-2.5 px-4 rounded-lg text-sm font-medium  ${location.pathname === '/categories' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMobileOpen(false)}
            >
              categories
            </Link>
            <Link 
              to="/reports" 
              className={`block py-2.5 px-4 rounded-lg text-sm font-medium ${location.pathname === '/reports' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setMobileOpen(false)}
            >
              Reports
            </Link>
            
            {/* Mobile Account Menu */}
         
{isAuthenticated && (
  <div className="pt-4 mt-4 border-t border-gray-200 space-y-1">
    <Link 
      to="/profile" 
      className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-700 hover:bg-gray-50"
      onClick={() => setMobileOpen(false)}
    >
      <User size={18} /> 
      <span className="text-sm">Profile</span>
    </Link>
    <Link 
      to="/settings" 
      className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-700 hover:bg-gray-50"
      onClick={() => setMobileOpen(false)}
    >
      <Settings size={18} /> 
      <span className="text-sm">Settings</span>
    </Link>
    <button 
      onClick={() => { 
        localStorage.removeItem("accessToken"); 
        window.location.href = "/"; 
      }}
      className="flex items-center gap-3 w-full py-2.5 px-4 rounded-lg text-red-600 hover:bg-red-50 text-left"
    >
      <LogOut size={18} /> 
      <span className="text-sm">Logout</span>
    </button>
  </div>
)}

          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;