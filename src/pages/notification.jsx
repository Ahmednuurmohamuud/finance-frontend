// src/components/NotificationDropdown.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
// import toast from "react-hot-toast";

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await api.get("/notifications/?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const notificationsData = res.data.results || res.data || [];
      setNotifications(notificationsData.slice(0, 5)); // Limit to 5
    } catch (err) {
      console.error("Notification fetch failed:", err);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await api.patch(`/notifications/${id}/`, {
        is_read: true
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        title="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full 
                          h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border 
                      border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              <span className="text-sm text-gray-500">{unreadCount} unread</span>
            </div>
          </div>

          <div className="overflow-y-auto max-h-64">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-gray-100 last:border-b-0 ${
                    n.is_read ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 mb-1">{n.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(n.sent_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="ml-2 text-green-600 hover:text-green-800 text-xs"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <a
              href="/notifications"
              className="text-sm text-blue-600 hover:text-blue-800 text-center block"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}