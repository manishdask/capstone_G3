import React from "react";
import ReactDOM from "react-dom/client";
import AppRoot from "./AppRoot.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles/tokens.css";

// The service worker's cache may only ever hold fingerprinted build assets.
// Earlier releases (cache "sgh-hms-v1.0.1") also cached same-origin /api GETs,
// including /api/auth/me — so on refresh a Patient was handed whichever user's
// profile was cached first, often the Admin's. The fixed sw.js deletes that
// cache when it activates, but the old worker is still in control during the
// first load after a deploy, so it is also purged here, before the app makes
// its first API call.
const LEGACY_CACHE_PREFIX = "sgh-hms-v1";

async function purgeLegacyCaches() {
  if (!window.caches) return;
  const names = await caches.keys();
  await Promise.all(names.filter((n) => n.startsWith(LEGACY_CACHE_PREFIX)).map((n) => caches.delete(n)));
}

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

function render() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </React.StrictMode>
  );
}

// Never let cache housekeeping block the app for long.
Promise.race([purgeLegacyCaches(), new Promise((r) => setTimeout(r, 1500))])
  .catch(() => {})
  .finally(render);
