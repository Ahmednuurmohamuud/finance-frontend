// src/services/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import api from "./api";
import toast from "react-hot-toast";

const GOOGLE_CLIENT_ID = "379616936425-u0q0jabn6172fk3oft9bbc11th2fdt34.apps.googleusercontent.com";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otpPending, setOtpPending] = useState(null);

  // ---------- Fetch current user ----------
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const res = await api.get("/users/me/");
          setUser(res.data);
        } catch (err) {
          console.error(err);
          setUser(null);
          localStorage.removeItem("accessToken");
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // ---------- Normal login ----------
 const login = async (usernameOrEmail, password) => {
    try {
        setError(null);
        const res = await api.post("/users/login/", { username: usernameOrEmail, password });
        
        if (res.data.otp_required) {
            setOtpPending({ user_id: res.data.user_id });
            return { otp_required: true };
        } else if (res.data.verification_required) {
            setOtpPending({ user_id: res.data.user_id });
            setError(res.data.detail);
            return { otp_required: false, verification_required: true };
        } else {
            localStorage.setItem("accessToken", res.data.access);
            const userRes = await api.get("/users/me/");
            setUser(userRes.data);
            return { otp_required: false, message: res.data.message };
        }
    } catch (err) {
        if (err.response?.data?.verification_required) {
            setOtpPending({ user_id: err.response.data.user_id });
            setError(err.response.data.detail);
        } else {
            setError(err.response?.data?.detail || err.message || "Login failed");
        }
        throw err;
    }
};


  // ---------- OTP verification ----------
  const verifyOtp = async (user_id, otp) => {
    try {
      const res = await api.post("/users/verify-otp/", { user_id, otp });
      localStorage.setItem("accessToken", res.data.access);
      const userRes = await api.get("/users/me/");
      setUser(userRes.data);
      setOtpPending(null);
      return res.data.message;
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "OTP verification failed");
      throw err;
    }
  };

// ---------- Resend OTP ----------
const resendOtp = async (user_id) => {
  try {
    await api.post("/users/resend-otp/", { user_id });
    toast.success("OTP resent! Check your email.");
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Failed to resend OTP";

    // Haddii backend uu diido sababta limit-ka
    if (err.response?.status === 429) {
      toast.error(message); // "You have reached the maximum of 3 OTP requests in 24 hours."
    } else {
      toast.error(message);
    }

    setError(message); // optional: show inline error in the UI
    throw err;
  }
};


  // ---------- Resend Verification Email ----------
const resendVerification = async (user_id) => {
    try {
        await api.post("/users/resend_verification/", { user_id });
        toast.success("Verification email resent! 📧");
    } catch (err) {
        setError(err.response?.data?.detail || "Failed to resend verification email");
        throw err;
    }
};

// ---------- Google login ----------
const loginWithGoogle = async (id_token) => {
  try {
    setError(null);
    const res = await api.post("/users/google-oauth/", {
      id_token,
      client_id: GOOGLE_CLIENT_ID
    });

    // Haddii backend-ku uu soo celiyo jawaab guul leh oo ay ku jiraan tokens-ka
    localStorage.setItem("accessToken", res.data.access);
    const userRes = res.data.user;
    setUser(userRes);

    return { user: userRes, access: res.data.access, refresh: res.data.refresh };
  } catch (err) {
    if (err.response && err.response.status === 403) {
      // Qabo error-ka 403 ka yimid backend-ka
      const detail = err.response.data.detail || "Please verify your email.";
      toast.error(detail, { icon: "📧" }); // Isticmaal toast.error si ay u muuqato fariin error ah
      setError(detail);
    } else {
      // Qabo error-ada kale
      const errorMessage = err.response?.data?.detail || err.message || "Google login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    }
    throw err;
  }
};

  // ---------- Register ----------
  const register = async (data) => {
    try {
      setError(null);
      const res = await api.post("/users/register/", data);
      localStorage.setItem("accessToken", res.data.access);

      const userRes = res.data.user;
      setUser(userRes);

      if (!userRes.is_verified) {
        toast("Please verify your email before using the account.", { icon: "📧" });
      }

      return { user: userRes, access: res.data.access, refresh: res.data.refresh };
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Registration failed");
      throw err;
    }
  };

  // ---------- Logout ----------
  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setOtpPending(null);
  };

  // ---------- Reset Password ----------
  const resetPassword = async (email) => {
    try {
      await api.post("/users/reset-password/", { email });
      toast.success("Password reset link sent to your email");
    } catch (err) {
      setError(err.response?.data?.error || "Reset request failed");
      throw err;
    }
  };

  const resetPasswordConfirm = async (uid, token, password) => {
    try {
      await api.post("/users/reset-password-confirm/", { uid, token, password });
      toast.success("Password changed successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed");
      throw err;
    }
  };

  const verifyEmail = async (token) => {
    try {
      const res = await api.post("/users/verify-email/", { token });
      toast.success(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Email verification failed");
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        otpPending,
        login,
        verifyOtp,
        resendOtp,
        resendVerification, // ✅ added
        loginWithGoogle,
        logout,
        register,
        resetPassword,
        resetPasswordConfirm,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
