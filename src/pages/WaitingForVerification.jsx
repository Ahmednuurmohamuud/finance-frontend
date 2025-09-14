import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function WaitingForVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || "";
  const [email, setEmail] = useState(emailFromState);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

// ...existing code...
const handleResend = async () => {
  if (!email) {
    toast.error("Please enter your email.");
    return;
  }
  setLoading(true);
  setError("");
  try {
    const res = await api.post("/users/resend_verification/", { email });
    toast.success(res.data.detail || "Verification email resent!");
    setResent(true);
  } catch (err) {
    // Halkan waxa lagu xakameynayaa error-ka 24 saac
    if (
      err.response?.status === 429 ||
      (err.response?.data?.detail && err.response.data.detail.includes("hore ayaa laguu diray"))
    ) {
      setError(
        "Verification email hore ayaa laguu diray. Fadlan isticmaal link-ii hore ama sug 24 saac ka hor intaadan mar kale codsan."
      );
      setResent(true);
    } else {
      setError(err.response?.data?.detail || "Failed to resend verification email");
    }
  } finally {
    setLoading(false);
  }
};
// ...existing code...

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center flex flex-col gap-6">
        <svg className="mx-auto h-16 w-16 text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12v1m0 4v.01M8 12v1m0 4v.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-indigo-700">Check Your Email</h2>
        <p className="text-gray-700">We sent a verification link to <span className="font-semibold text-indigo-600">{emailFromState || email}</span>. Please verify your account to continue.</p>
        <div className="flex flex-col gap-2 mt-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            disabled={!!emailFromState}
          />
          <button
            onClick={handleResend}
            disabled={loading || resent}
            className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition text-base font-medium shadow-sm shadow-indigo-100 disabled:opacity-60"
          >
            {loading ? "Sending..." : resent ? "Verification Sent!" : "Resend Verification Email"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          onClick={() => navigate("/")}
          className="mt-2 w-full bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition text-base font-medium"
        >
          Back to Home
        </button>
        <div className="text-gray-400 text-xs mt-4">Waiting for verification... Please refresh after verifying.</div>
      </div>
    </div>
  );
}