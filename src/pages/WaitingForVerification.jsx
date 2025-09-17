import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function WaitingForVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || "";
  const isFromRegister = location.state?.fromRegister || false;
  const isFromLogin = location.state?.fromLogin || false;
  
  const [email, setEmail] = useState(emailFromState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(isFromRegister);

  // Determine initial UI state based on user flow
  const [uiState, setUiState] = useState({
    showEmailInput: isFromLogin,
    showOtpInput: isFromRegister,
    showSendButton: isFromLogin
  });

  useEffect(() => {
    // Set initial UI state based on where user is coming from
    if (isFromRegister) {
      setUiState({
        showEmailInput: false,
        showOtpInput: true,
        showSendButton: true
      });
    } else if (isFromLogin) {
      setUiState({
        showEmailInput: true,
        showOtpInput: false,
        showSendButton: false
      });
    }
  }, [isFromRegister, isFromLogin]);

const handleSendVerification = async () => {
  if (!email) {
    toast.error("Please enter your email.");
    return;
  }
  
  setLoading(true);
  setError("");
  try {
    // Door endpoint-ka saxda ah
    const endpoint = isFromRegister
      ? "/users/send_verification/"
      : "/users/resend_verification/";

    // Dir request
    const res = await api.post(endpoint, { email });

    toast.success(res.data.detail || "Verification email sent!");
    setEmailSent(true);
    
    // Update UI state after sending email
    setUiState({
      showEmailInput: false,
      showOtpInput: true,
      showSendButton: true
    });
  } catch (err) {
    setError(err.response?.data?.detail || "Failed to send verification email");
  } finally {
    setLoading(false);
  }
};


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
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!email || !otp) {
      toast.error("Please enter your email and OTP code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.post("/users/verify_email/", { email, code: otp });
      toast.success(res.data.detail || "Email verified successfully!");
      setVerified(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  // Enable send button only if email is entered (for login flow)
  useEffect(() => {
    if (isFromLogin && !emailSent) {
      setUiState(prev => ({
        ...prev,
        showSendButton: email.length > 0
      }));
    }
  }, [email, emailSent, isFromLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center flex flex-col gap-6">
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
            d="M16 12v1m0 4v.01M8 12v1m0 4v.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-indigo-700">Check Your Email</h2>
        <p className="text-gray-700">
          We sent a verification code to{" "}
          <span className="font-semibold text-indigo-600">
            {emailFromState || email}
          </span>
          . Please verify your account to continue.
        </p>

        {/* OTP Input and Verify Button - Only show if OTP input is enabled */}
        {uiState.showOtpInput && (
          <div className="flex flex-col gap-2 mt-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP code"
              className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            />
            <button
              onClick={handleVerifyOTP}
              disabled={loading || verified}
              className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition text-base font-medium shadow-sm shadow-green-100 disabled:opacity-60"
            >
              {loading ? "Verifying..." : verified ? "Verified!" : "Verify OTP"}
            </button>
          </div>
        )}

        {/* Email Input and Send/Resend Button - Only show if not verified */}
        {!verified && (
          <div className="flex flex-col gap-2 mt-2">
            {uiState.showEmailInput && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              />
            )}
            
            {uiState.showSendButton && (
             <button
  onClick={emailSent ? handleResend : handleSendVerification}
  disabled={loading}
  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition text-base font-medium shadow-sm shadow-indigo-100 disabled:opacity-60 mt-2"
>
  {loading 
    ? "Sending..." 
    : emailSent 
      ? "Resend Verification Email" 
      : isFromRegister 
        ? "Send Verification Email" 
        : "Send Login Verification"}
</button>

            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          onClick={() => navigate("/")}
          className="mt-2 w-full bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition text-base font-medium"
        >
          Back to Home
        </button>

        <div className="text-gray-400 text-xs mt-4">
          Waiting for verification... Please refresh after verifying.
        </div>
      </div>
    </div>
  );
}