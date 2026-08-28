import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Loading…" }) {
  return (
    <div className="f-loading f-body">
      <Loader2 size={16} className="spin" />
      {label}
    </div>
  );
}
