import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";

export default function InstallButton({ style = {}, className = "" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        "📱 How to Download & Install St George HMS on Your Device:\n\n" +
        "• Chrome / Edge (Desktop & Android): Click the 📥 Install icon in your address bar or menu ➔ select 'Install St George HMS'.\n" +
        "• iPhone / iPad (Safari): Tap the Share button (square with up arrow) ➔ select 'Add to Home Screen'.\n" +
        "• Mac Safari: Click File ➔ 'Add to Dock'."
      );
    }
  };

  return (
    <button
      onClick={handleInstall}
      className={`f-body ${className}`}
      title="Install application on your device"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#0e7f8c",
        color: "#ffffff",
        border: "none",
        borderRadius: 999,
        padding: "7px 14px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        transition: "all 0.15s ease",
        ...style,
      }}
    >
      <Download size={14} />
      <span>Install App</span>
    </button>
  );
}
