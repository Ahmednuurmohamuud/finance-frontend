import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="379616936425-u0q0jabn6172fk3oft9bbc11th2fdt34.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
