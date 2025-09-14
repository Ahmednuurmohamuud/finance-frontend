import React, { useState, useEffect } from "react";
import api from "../services/api";// axios instance with token

export default function Profile() {
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch user profile and currencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, currenciesRes] = await Promise.all([
          api.get("/users/me/"),
          api.get("/currencies/") // Assuming you have an endpoint for currencies
        ]);
        
        setUser(userRes.data);
        setCurrencies(currenciesRes.data);
        
        // Set photo if exists
        if (userRes.data.photo) {
          setPhoto(userRes.data.photo);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhoto(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      
      // Append user data
      formData.append("first_name", user.first_name || "");
      formData.append("last_name", user.last_name || "");
      formData.append("phone", user.phone || "");
      formData.append("monthly_income_est", user.monthly_income_est || 0);
      formData.append("savings_goal", user.savings_goal || 0);
      formData.append("preferred_currency", user.preferred_currency || "USD");
      
      // Append photo if selected
      if (photoFile) {
        formData.append("photo", photoFile);
      }
      
      // Update backend
      const res = await api.patch("/users/me/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setMessage("Profile updated successfully!");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading profile...</p>;
  if (!user) return <p className="p-6 text-red-500">No user data found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Profile Information</h1>
        
        {message && (
          <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message}
          </div>
        )}

        {/* Photo Upload */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
            {photo ? (
              <img src={photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                No Photo
              </div>
            )}
          </div>
          <label className="cursor-pointer text-blue-600 hover:underline">
            Change Photo
            <input
              type="file"
              accept="image/png, image/jpeg, image/gif"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
          <p className="text-xs text-gray-400">JPG, PNG or GIF. Max size 2MB.</p>
        </div>

        {/* Profile Form */}
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={user.first_name || ""}
                onChange={(e) => setUser({ ...user, first_name: e.target.value })}
                placeholder="First Name"
                className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={user.last_name || ""}
                onChange={(e) => setUser({ ...user, last_name: e.target.value })}
                placeholder="Last Name"
                className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email || ""}
              readOnly
              className="border px-3 py-2 rounded-lg w-full bg-gray-100 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              placeholder="Phone Number"
              className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Currency *</label>
              <select
                value={user.preferred_currency || "USD"}
                onChange={(e) => setUser({ ...user, preferred_currency: e.target.value })}
                className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Two-Factor Authentication</label>
              <div className="flex items-center mt-2">
                <button
                  onClick={() => setUser({ ...user, two_factor_enabled: !user.two_factor_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${user.two_factor_enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${user.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="ml-3 text-sm text-gray-700">
                  {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income Estimate *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  {user.preferred_currency || "USD"}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={user.monthly_income_est || ""}
                  onChange={(e) => setUser({ ...user, monthly_income_est: e.target.value })}
                  placeholder="0.00"
                  className="border px-3 py-2 rounded-lg w-full pl-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  min="0"
                  step="0.01"
                  value={user.savings_goal || ""}
                  onChange={(e) => setUser({ ...user, savings_goal: e.target.value })}
                  placeholder="0.00"
                  className="border px-3 py-2 rounded-lg w-full pl-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        
        {(!user.first_name || !user.last_name || !user.phone || !user.monthly_income_est) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Profile incomplete:</strong> Please fill in all required fields (marked with *) to complete your profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}