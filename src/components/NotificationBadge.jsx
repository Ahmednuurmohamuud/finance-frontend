import { useEffect, useState, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import api from "../services/api";

export default function NotificationBadge({ refreshFlag = 0 }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const fetchUnread = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      // Fetch unread count
      const countRes = await api.get("/notifications/unread_count/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(countRes.data.unread_count || 0);

      // Fetch unread notifications
      const notifRes = await api.get("/notifications/unread/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifRes.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await api.post(
        "/notifications/mark_all_read/",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUnreadCount(0);
      setNotifications([]);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [refreshFlag]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="relative mr-2">
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 text-xs text-white bg-red-500 w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-50">
          <div className="flex justify-between items-center p-2 border-b">
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-green-600 flex items-center"
              >
                <Check size={12} className="mr-1" /> Mark All Read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-2 text-sm text-gray-500">No unread notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-2 border-b hover:bg-gray-100 cursor-pointer"
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-gray-600">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
