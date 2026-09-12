import React from "react";
import ReactDOM from "react-dom/client";
import AppRoot from "./AppRoot.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles/tokens.css";

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if (window.caches) {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
    }
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </React.StrictMode>
  );
}
