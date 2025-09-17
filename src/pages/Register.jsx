// src/pages/Register.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, ArrowRight, Mail, User, Currency, Lock } from "lucide-react";

export default function Register() {
  const { register, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    preferred_currency: "USD",
  });
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Fetch currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await api.get("/currencies/");
        setCurrencies(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to load currencies", err);
      }
    };
    fetchCurrencies();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (e.target.name === "password") {
      setPasswordError(
        e.target.value.length < 8
          ? "Password must be at least 8 characters"
          : ""
      );
    }
  };

  // ===== Register with email =====
// ===== Register with email =====
const handleSubmit = async (e) => {
  e.preventDefault();

  // Hubi password length
  if (form.password.length < 8) {
    return setPasswordError("Password must be at least 8 characters");
  }

  setLoading(true);
  setError("");

  try {
    // Wac function-ka register ee auth.context
    const res = await register(form);

    // Haddii email aan la verify-gareyn
    if (!res.user.is_verified) {
      toast("📧 Please check your email to verify your account.");

      // Navigate user-ka u gudbi WaitingForVerification page
      navigate("/waiting-for-verification", { 
        state: { 
          email: form.email,
          fromRegister: true   // Muhiim: sheegaya flow-ka register
        } 
      });
    } else {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    }

  } catch (err) {
    const errorMsg =
      err.response?.data?.email?.[0] ||
      err.response?.data?.username?.[0] ||
      err.response?.data?.detail ||
      "Registration failed";
    toast.error(errorMsg);
    setError(errorMsg);
  } finally {
    setLoading(false);
  }
};



  // ===== Google Sign-Up =====
  const handleGoogleSignUp = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      if (!credentialResponse.credential) throw new Error("Google Sign-Up failed");

      const res = await loginWithGoogle(credentialResponse.credential);

      if (!res.user.is_verified) {
        toast("📧 Please verify your email sent by Google before using the account.");
      } else {
        toast.success("Signed up successfully with Google!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Google Sign-Up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left side - Illustration/Info */}
        <div className="md:w-2/5 bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-8 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Join Our Community</h1>
            <p className="text-indigo-200">Start your financial journey with us today</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-indigo-500 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Stay on top of your spending</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-indigo-500 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Manage all your accounts in one place</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-indigo-500 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Get insights that grow your savings</span>
            </div>
          </div>
          
          <div className="mt-10 text-indigo-200 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-white font-semibold underline">
              Sign in here
            </Link>
          </div>
        </div>
        
        {/* Right side - Form */}
        <div className="md:w-3/5 p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-500 mt-2">Sign up to get started</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSignUp}
              onError={() => toast.error("Google Sign-Up failed")}
              theme="filled_blue"
              size="large"
              text="signup_with"
              shape="pill"
            />
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="w-full h-px bg-gray-300/90"></div>
            <p className="text-sm text-gray-500/90 whitespace-nowrap">or continue with email</p>
            <div className="w-full h-px bg-gray-300/90"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="relative">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="absolute mt-5 inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Username"
                required
                className="pl-10 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-3 rounded-xl w-full focus:outline-none transition"
              />
            </div>


            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="absolute mt-5 inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="pl-10 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-3 rounded-xl w-full focus:outline-none transition"
              />
            </div>


            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="absolute mt-5 inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="pl-10 pr-12 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-3 rounded-xl w-full focus:outline-none transition"
              />
              <button
                type="button"
                className="absolute right-3 top-9.5 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {passwordError && (
              <div className="text-red-500 text-sm flex items-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {passwordError}
              </div>
            )}


            <div className="relative">
              <label htmlFor="preferred_currency" className="block text-sm font-medium text-gray-700 mb-1">Preferred Currency</label>
              <div className="absolute mt-5 inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Currency className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="preferred_currency"
                name="preferred_currency"
                value={form.preferred_currency}
                onChange={handleChange}
                className="pl-10 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-3 rounded-xl w-full focus:outline-none appearance-none transition"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Verification waiting UI moved to /waiting-for-verification page */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 px-4 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center font-medium shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}