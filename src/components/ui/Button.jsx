import React from "react";

const VARIANTS = {
  primary: { background: "var(--amber)", color: "var(--ink-deep)" },
  dark: { background: "var(--ink)", color: "#fff" },
  ghost: { background: "transparent", color: "var(--ink)", border: "1px solid var(--line)" },
  danger: { background: "#F8E9EC", color: "var(--rose)" },
};

export default function Button({ children, onClick, variant = "primary", full, small, icon: Icon, disabled, type = "button" }) {
  const style = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="f-body"
      style={{
        ...style,
        border: style.border || "none",
        padding: small ? "8px 14px" : "12px 18px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: small ? 13 : 14,
        width: full ? "100%" : "auto",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "transform .12s ease",
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {Icon && <Icon size={small ? 14 : 16} />}
      {children}
    </button>
  );
}
