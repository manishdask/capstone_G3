import React from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="f-error f-body" role="alert" style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <AlertCircle size={14} />
        {message || "Something went wrong. Please try again."}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="f-body"
          style={{ background: "none", border: "none", color: "var(--rose)", fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
