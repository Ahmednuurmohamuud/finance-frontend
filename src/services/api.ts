// src/service/api.js
import axios from "axios";

// Create an Axios instance
const api = axios.create({
  // baseURL: "http://localhost:8000/api", // Local
  baseURL: "https://finance-backend.up.railway.app/api", // Production
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: add interceptors for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // ama cookie
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
