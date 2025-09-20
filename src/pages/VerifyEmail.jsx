// src/pages/VerifyEmail.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState(""); // email user enters for resend
  const [cooldown, setCooldown] = useState(0); // Cooldown timer for resend

  // Handle cooldown timer
  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Verification token is missing.");
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      setLoading(true);
      try {
        const res = await api.post("/users/verify_email/", { token });
        setSuccess(res.data.message || "Email verified successfully!");
        toast.success(res.data.message || "Email verified successfully!");
        setTimeout(() => navigate("/dashboard"), 3000); // Fixed path to lowercase
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.error || "Failed to verify email. Token may be expired."
        );
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email to resend verification.");
      return;
    }
    
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before trying again.`);
      return;
    }
    
    setResendLoading(true);
    setError("");
    try {
      // Fixed endpoint path (added underscore)
      const res = await api.post("/users/resend_verification/", { email });
      toast.success(res.data.detail || "Verification email resent! 📧");
      // Set cooldown timer (2 minutes = 120 seconds)
      setCooldown(120);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to resend verification email";
      setError(errorMsg);
      toast.error(errorMsg);
      
      // If it's a rate limit error, set cooldown
      if (err.response?.status === 429) {
        setCooldown(120);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-5 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-2">Verify Your Email</h2>
        {loading && <p className="text-gray-600">Verifying your email...</p>}
        {success && <p className="text-green-500">{success}</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && error && (
          <>
            <div className="text-left">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>
            
            <button
              onClick={handleResendVerification}
              disabled={resendLoading || cooldown > 0}
              className="mt-4 w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition text-base font-medium shadow-sm shadow-indigo-100 disabled:opacity-60"
            >
              {resendLoading 
                ? "Sending..." 
                : cooldown > 0 
                  ? `Resend available in ${formatTime(cooldown)}`
                  : "Resend Verification Email"}
            </button>
            
            <button
              onClick={() => navigate("/register")}
              className="mt-2 w-full bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition text-base font-medium"
            >
              Back to Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}