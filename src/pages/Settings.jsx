
import React, { useState, useEffect } from "react";
import api from "../services/api";

// Helper to get absolute photo URL
const getPhotoUrl = (photo) => {
    if (!photo) return null;
    // If already absolute (starts with http), return as is
    if (/^https?:\/\//.test(photo)) return photo;
    // Otherwise, prepend backend base URL
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    // Remove trailing slash from BASE_URL and leading slash from photo
    return `${BASE_URL.replace(/\/$/, "")}/${photo.replace(/^\//, "")}`;
};

export default function Settings() {
    const [activeTab, setActiveTab] = useState("profile");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photo, setPhoto] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [currencies, setCurrencies] = useState([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

       // States for account deletion modal
    const [showModal, setShowModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    // Notifications
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifSMS, setNotifSMS] = useState(false);

    // Security
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [twoFactor, setTwoFactor] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({});

 // -------- Fetch user + currencies --------

useEffect(() => {
    const fetchData = async () => {
        try {
            const [userRes, currRes] = await Promise.all([
                api.get("/users/me/"),
                api.get("/currencies/")
            ]);

            setUser(userRes.data);
            setTwoFactor(userRes.data.two_factor_enabled || false);

            const currencyData = Array.isArray(currRes.data)
                ? currRes.data
                : currRes.data.results || [];
            setCurrencies(currencyData);

            // -------- Photo comes ready from backend --------
            if (userRes.data.photo) {
                setPhoto(userRes.data.photo);
            }

        } catch (err) {
            console.error("Error fetching user/currencies:", err);
            showMessage("Failed to load settings", "error");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
}, []);

// -------- Message helper --------
const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
};

// -------- Handlers --------
const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showMessage("Image size must be less than 2MB", "error");
            return;
        }

        // Preview the new photo locally
        setPhoto(URL.createObjectURL(file));
        setPhotoFile(file);
    }
};

const handleProfileSave = async () => {
    setSaving(true);
    try {
        const formData = new FormData();
        formData.append("first_name", user.first_name || "");
        formData.append("last_name", user.last_name || "");
        formData.append("email", user.email || "");
        formData.append("phone", user.phone || "");
        formData.append(
            "preferred_currency",
            user.preferred_currency?.code || user.preferred_currency || "USD"
        );
        formData.append("monthly_income_est", user.monthly_income_est || 0);
        formData.append("savings_goal", user.savings_goal || 0);
        if (photoFile) formData.append("photo", photoFile);

        const res = await api.patch("/users/me/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        setUser(res.data);

        // ===== Photo URL direct from backend =====
        if (res.data.photo) {
            setPhoto(res.data.photo);
        }

        setPhotoFile(null); // Reset photo file
        showMessage("Profile updated successfully!");
    } catch (err) {
        console.error("Update failed:", err.response?.data || err);
        showMessage("Failed to update profile", "error");
    } finally {
        setSaving(false);
    }
};


    const validatePassword = () => {
        const errors = {};
        
        if (!currentPassword) {
            errors.currentPassword = "Current password is required";
        }
        
        if (!newPassword) {
            errors.newPassword = "New password is required";
        } else if (newPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters";
        }
        
        if (newPassword !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }
        
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePasswordUpdate = async () => {
        if (!validatePassword()) return;
        
        try {
            await api.post("/users/change-password/", {
                current_password: currentPassword,
                new_password: newPassword,
            });
            
            showMessage("Password updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordErrors({});
        } catch (err) {
            console.error("Password change failed:", err.response?.data || err);
            const errorMsg = err.response?.data?.detail || "Failed to update password";
            showMessage(errorMsg, "error");
        }
    };

    const handleTwoFactorToggle = async () => {
        try {
            const res = await api.patch("/users/me/", {
                two_factor_enabled: !twoFactor,
            });
            
            setTwoFactor(res.data.two_factor_enabled);
            showMessage(`Two-factor authentication ${res.data.two_factor_enabled ? "enabled" : "disabled"}`);
        } catch (err) {
            console.error("2FA toggle failed:", err.response?.data || err);
            showMessage("Failed to update 2FA setting", "error");
        }
    };

  const handleOpenDeleteModal = () => {
        setConfirmText(""); // Reset the confirmation input
        setShowModal(true);
    };

    const handleConfirmDelete = async () => {
        if (confirmText !== user.email) {
            showMessage("Confirmation text does not match your email.", "error");
            return;
        }

        try {
            await api.delete("/users/me/");
            showMessage("Account deleted successfully");
            // Redirect to home or login page
            window.location.href = "/";
        } catch (err) {
            console.error("Delete failed:", err.response?.data || err);
            showMessage("Failed to delete account", "error");
        }
    };


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
    
    if (!user) return (
        <div className="p-6 text-red-500">
            No user data found. Please try logging in again.
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
                <p className="text-gray-600 mb-8">Manage your account preferences and settings</p>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.type === "error" 
                            ? "bg-red-100 text-red-700 border border-red-200" 
                            : "bg-green-100 text-green-700 border border-green-200"
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
                    {["profile", "security", "notifications", "privacy"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 font-medium transition relative ${
                                activeTab === tab
                                    ? "text-indigo-600 font-semibold"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab === "profile" && "Profile"}
                            {tab === "security" && "Security"}
                            {tab === "notifications" && "Notifications"}
                            {tab === "privacy" && "Data & Privacy"}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="bg-white shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Information</h2>

                        {/* Photo */}
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                {photo ? (
                                    <img src={getPhotoUrl(photo)} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                        <span className="text-4xl text-indigo-400 font-semibold">
                                            {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition">
                                Change Photo
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg, image/gif"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />
                            </label>
                            <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
                        </div>

                        {/* Name */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={user.first_name || ""}
                                    onChange={(e) => setUser({ ...user, first_name: e.target.value })}
                                    placeholder="First Name"
                                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={user.last_name || ""}
                                    onChange={(e) => setUser({ ...user, last_name: e.target.value })}
                                    placeholder="Last Name"
                                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Email + Phone */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={user.email || ""}
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                    placeholder="Email Address"
                                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={user.phone || ""}
                                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                    placeholder="Phone Number"
                                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Currency + Income + Savings */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Currency</label>
                                <select
                                    value={user.preferred_currency || "USD"}
                                    onChange={(e) => setUser({ ...user, preferred_currency: e.target.value })}
                                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    {currencies.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} - {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                        {user.preferred_currency || "USD"}
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={user.monthly_income_est || ""}
                                        onChange={(e) => setUser({ ...user, monthly_income_est: e.target.value })}
                                        placeholder="0.00"
                                        className="border border-gray-300 px-4 py-2 rounded-lg w-full pl-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Savings Goal (Optional)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                        {user.preferred_currency || "USD"}
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={user.savings_goal || ""}
                                        onChange={(e) => setUser({ ...user, savings_goal: e.target.value })}
                                        placeholder="0.00"
                                        className="border border-gray-300 px-4 py-2 rounded-lg w-full pl-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleProfileSave}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                    <div className="bg-white shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Security Settings</h2>

                        {/* Password Update */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-700">Change Password</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                {passwordErrors.currentPassword && (
                                    <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                {passwordErrors.newPassword && (
                                    <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                {passwordErrors.confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                                )}
                            </div>
                            
                            <button
                                onClick={handlePasswordUpdate}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Update Password
                            </button>
                        </div>

                        {/* Two-Factor Authentication */}
                        <div className="pt-6 border-t border-gray-200">
                            <h3 className="font-medium text-gray-700 mb-3">Two-Factor Authentication</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Two-Factor Authentication (2FA)</p>
                                    <p className="text-sm text-gray-500">
                                        Add an extra layer of security to your account
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={twoFactor}
                                        onChange={handleTwoFactorToggle}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                    <div className="bg-white shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Notification Preferences</h2>
                        
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive important updates via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifEmail}
                                    onChange={() => setNotifEmail(!notifEmail)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium">SMS Notifications</p>
                                <p className="text-sm text-gray-500">Receive important updates via text message</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifSMS}
                                    onChange={() => setNotifSMS(!notifSMS)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                )}

             {/* Data & Privacy Tab */}
                {activeTab === "privacy" && (
                    <div className="bg-white shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Data & Privacy</h2>
                        
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="font-medium text-red-800 mb-2">Danger Zone</h3>
                            <p className="text-sm text-red-700 mb-4">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            
                            <button
                                onClick={handleOpenDeleteModal}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                            >
                                Delete My Account
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Account Deletion Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-xl">
                        <h3 className="text-xl font-bold text-red-600 mb-4">Are you absolutely sure?</h3>
                        <p className="text-gray-700 mb-4">
                            Unexpected bad things will happen if you don’t read this! This will permanently delete your account, including your profile information, transaction history, and all associated data. This action **cannot be undone**.
                        </p>
                        <p className="text-gray-700 mb-4">
                            To confirm, please type your email address **<span className="font-semibold">{user.email}</span>** in the box below:
                        </p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={`Type "${user.email}" here`}
                            className="border border-gray-300 px-4 py-2 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={confirmText !== user.email}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                I understand, delete my account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
