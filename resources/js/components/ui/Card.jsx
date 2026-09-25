import React from "react";

// Forwards any other props (onClick, role, aria-*) to the element — without
// this, a clickable Card rendered a pointer cursor but silently dropped its
// handler, which is how the patient dashboard's quick actions went dead.
export default function Card({ children, style, className, ...rest }) {
  return (
    <div
      className={className ? `rise ${className}` : "rise"}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 16,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
