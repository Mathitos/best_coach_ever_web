import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);
