// src/pages/ResetPasswordRequest.jsx
import React, { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function ResetPasswordRequest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      await api.post("/users/reset-password/", { email });
      toast.success("Reset link sent! Check your inbox.");
      setEmail("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error sending reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form onSubmit={handleRequest} className="bg-white p-6 rounded-2xl shadow w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Reset Password</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full mt-1 rounded-xl border px-3 py-2"
        />
        <button type="submit" disabled={loading} className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
