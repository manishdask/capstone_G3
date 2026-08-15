import React from "react";
import { LogOut, Mail, Building2 } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Avatar from "../ui/Avatar.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";

const ROLE_LABEL = {
  patient: "Patient",
  doctor: "Doctor",
  staff: "Clinic Staff",
  admin: "Administrator",
};

// Reused as the "Profile" tab for Patient, Doctor and Staff roles.
export default function PatientProfile({ user, onLogout }) {
  if (!user) return null;
  return (
    <div>
      <ScreenHeader title="Profile" />
      <div style={{ padding: "0 18px" }}>
        <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={user.name} size={48} />
          <div style={{ flex: 1 }}>
            <div className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>
              {user.name}
            </div>
            <div className="f-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              {user.patientId || user.id}
            </div>
          </div>
          <Badge>{ROLE_LABEL[user.role]}</Badge>
        </Card>

        <Card style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <Mail size={14} color="var(--muted)" />
            <span className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)" }}>{user.email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 4px", borderTop: "1px solid var(--line)", marginTop: 6 }}>
            <Building2 size={14} color="var(--muted)" />
            <span className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)" }}>{user.branch} Branch</span>
          </div>
        </Card>
      </div>
      <div style={{ padding: "14px 18px 20px" }}>
        <Button full variant="ghost" icon={LogOut} onClick={onLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}