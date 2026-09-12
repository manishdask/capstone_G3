import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles/tokens.css";

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  } else {
    // A cache-first service worker has no place in dev — it silently serves
    // stale JS (and can intercept cross-origin API calls) in a way normal
    // hard-refreshes can't undo. Actively unregister any leftover worker and
    // wipe its cache so `npm run dev` is never fighting stale cached state.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if (window.caches) {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
    }
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
