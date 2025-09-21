import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromURL = searchParams.get("token");
  
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("pending"); // pending, success, error
  const [resendCooldown, setResendCooldown] = useState(0);

  // Wrap handleVerifyEmail in useCallback to prevent unnecessary recreations
  const handleVerifyEmail = useCallback(async (token) => {
    setLoading(true);
    try {
      const response = await api.post("/users/verify_email/", { token });
      
      if (response.data.verified) {
        setVerificationStatus("success");
        toast.success(response.data.message || "Email verified successfully!");
        
        // Redirect to dashboard immediately after successful verification
        navigate("/dashboard");
      }
    } catch (err) {
      setVerificationStatus("error");
      const errorMsg = err.response?.data?.error || "Failed to verify email";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Check if we have a token in the URL on component mount
  useEffect(() => {
    if (tokenFromURL) {
      handleVerifyEmail(tokenFromURL);
    }
  }, [tokenFromURL, handleVerifyEmail]);

  // Handle countdown timer for resend cooldown
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/users/resend_verification/", { email });
      toast.success(response.data.detail || "Verification email sent!");
      
      // Start cooldown timer (2 minutes = 120 seconds)
      setResendCooldown(120);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to resend verification email";
      
      // Check if it's a rate limit error
      if (err.response?.status === 429) {
        setResendCooldown(120);
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center flex flex-col gap-6">
        {verificationStatus === "pending" && (
          <>
            <svg
              className="mx-auto h-16 w-16 text-indigo-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-indigo-700">Verify Your Email</h2>
            <p className="text-gray-700">
              {tokenFromURL 
                ? "Verifying your email..." 
                : "Please check your email for a verification link."}
            </p>
            
            {!tokenFromURL && (
              <>
                <div className="flex flex-col gap-2 mt-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  />
                  <button
                    onClick={handleResendVerification}
                    disabled={loading || resendCooldown > 0}
                    className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition text-base font-medium shadow-sm shadow-indigo-100 disabled:opacity-60"
                  >
                    {loading 
                      ? "Sending..." 
                      : resendCooldown > 0 
                        ? `Resend available in ${formatTime(resendCooldown)}`
                        : "Resend Verification Email"}
                  </button>
                </div>
                
                <p className="text-gray-500 text-sm">
                  Didn't receive the email? Check your spam folder or request a new verification link.
                </p>
              </>
            )}
          </>
        )}
        
        {verificationStatus === "success" && (
          <>
            <svg
              className="mx-auto h-16 w-16 text-green-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-green-700">Email Verified!</h2>
            <p className="text-gray-700">
              Your email has been successfully verified. Redirecting to dashboard...
            </p>
          </>
        )}
        
        {verificationStatus === "error" && (
          <>
            <svg
              className="mx-auto h-16 w-16 text-red-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-red-700">Verification Failed</h2>
            <p className="text-gray-700">
              The verification link is invalid or has expired.
            </p>
            
            <div className="flex flex-col gap-2 mt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              />
              <button
                onClick={handleResendVerification}
                disabled={loading || resendCooldown > 0}
                className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition text-base font-medium shadow-sm shadow-indigo-100 disabled:opacity-60"
              >
                {loading 
                  ? "Sending..." 
                  : resendCooldown > 0 
                    ? `Resend available in ${formatTime(resendCooldown)}`
                    : "Request New Verification Email"}
              </button>
            </div>
          </>
        )}
        
        <button
          onClick={() => navigate("/")}
          className="mt-2 w-full bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition text-base font-medium"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}