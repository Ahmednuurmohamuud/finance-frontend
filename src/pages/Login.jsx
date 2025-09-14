// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Shield } from "lucide-react";

export default function Login() {
  const {
    login,
    otpPending,
    verifyOtp,
    resendOtp,
    resendVerification,
    loginWithGoogle,
  } = useContext(AuthContext);

  const [form, setForm] = useState({ username: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  try {
    const res = await login(form.username, form.password);

    if (res.otp_required) {
      toast("OTP sent! Please check your email.", { icon: "🔐" });
    } else if (res.verification_required) {
      toast.error(res.message || "Please verify your account.");
      // U dir user-ka page-ka sugitaanka verification
      navigate("/waiting-for-verification", {
        state: { email: res.email || form.username },
      });
    } else {
      toast.success(res.message);
      navigate("/dashboard");
    }
  } catch (err) {
    const detail = err.response?.data?.detail || "Login failed";
    setError(detail);

    if (detail.toLowerCase().includes("verify")) {
      toast.error("⚠️ Please verify your account before logging in.");
      // U dir user-ka page-ka sugitaanka verification
      navigate("/waiting-for-verification", {
        state: { email: form.email },
      });
    }
  } finally {
    setLoading(false);
  }
};;

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpPending) return;
    setLoading(true);
    setError("");
    try {
      const message = await verifyOtp(otpPending.user_id, otp);
      toast.success(message);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      if (!credentialResponse.credential) throw new Error("Google login failed");
      await loginWithGoogle(credentialResponse.credential);
      toast.success("Logged in with Google!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to home
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {otpPending ? "Verify Your Identity" : "Welcome Back"}
              </h2>
              <p className="text-gray-600">
                {otpPending
                  ? "Enter the verification code sent to your email"
                  : "Sign in to access your financial dashboard"}
              </p>
            </div>

            {/* Error + Resend Verification */}
            {error &&  (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                <p className={`text-sm ${error.toLowerCase().includes("verify") ? "text-gray-700" : "text-red-600"}`}>
                  {error}
                </p>
                {error.toLowerCase().includes("verify") && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await resendVerification(otpPending?.user_id || form.username);
                        toast.success("Verification email sent! 📧");
                      } catch (err) {
                        toast.error(
                          err.response?.data?.detail || "Failed to resend verification email"
                        );
                      }
                    }}
                    className="mt-3 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                  >
                    Resend Verification Email
                  </button>
                )}
              </div>
            )}

            <form onSubmit={otpPending ? handleOtpSubmit : handleSubmit} className="space-y-6">
              {!otpPending ? (
                <>
                  {/* Username/Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Enter your username or email"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Link
                        to="/reset-password"
                        className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Google Login */}
                  <div className="pt-2">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => toast.error("Google login failed")}
                        theme="filled_blue"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Field */}
                  <div className="space-y-2">
                    <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                      Verification Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="otp"
                        name="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit code"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => resendOtp(otpPending.user_id)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Resend code
                    </button>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : otpPending ? (
                  "Verify Code"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            {!otpPending && (
              <p className="text-gray-600 text-sm text-center mt-6">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Sign up now
                </Link>
              </p>
            )}
          </div>

          {/* Security Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Shield size={14} className="mr-1" />
              Your data is securely encrypted and protected
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}