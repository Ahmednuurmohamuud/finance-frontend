// src/components/PrivateRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p>Loading...</p>; // Show loading state while checking auth
  }

  if (!user) {
    return <Navigate to="/login" replace />; // Redirect if not logged in
  }

  return children; // Render the protected component
}
