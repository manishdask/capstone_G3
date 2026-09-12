import React, { useState } from "react";
import { Home, Search, Calendar, FileText, User, ClipboardList, Users, Pill, Activity, BarChart3, Building2, TrendingUp, ShieldCheck, FlaskConical, Settings, MessageSquare, FileEdit, ShieldAlert, CreditCard } from "lucide-react";

import PhoneFrame from "./components/frames/PhoneFrame.jsx";
import AdminShell from "./components/frames/AdminShell.jsx";
import IdleTimer from "./components/ui/IdleTimer.jsx";
import Login from "./pages/auth/Login.jsx";
import MfaSetup from "./pages/auth/MfaSetup.jsx";
import PublicSite from "./pages/public/PublicSite.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import PatientHome from "./pages/patient/PatientHome.jsx";
import PatientFind from "./pages/patient/PatientFind.jsx";
import PatientDoctorProfile from "./pages/patient/PatientDoctorProfile.jsx";
import PatientAppointments from "./pages/patient/PatientAppointments.jsx";
import PatientRecords from "./pages/patient/PatientRecords.jsx";
import PatientProfile from "./pages/patient/PatientProfile.jsx";
import PatientFeedback from "./pages/patient/PatientFeedback.jsx";

import DoctorSchedule from "./pages/doctor/DoctorSchedule.jsx";
import DoctorRequests from "./pages/doctor/DoctorRequests.jsx";
import DoctorPatients from "./pages/doctor/DoctorPatients.jsx";

import StaffAppointments from "./pages/staff/StaffAppointments.jsx";
import StaffVitals from "./pages/staff/StaffVitals.jsx";
import StaffPharmacy from "./pages/staff/StaffPharmacy.jsx";
import StaffAdmissions from "./pages/staff/StaffAdmissions.jsx";
import StaffLabDesk from "./pages/staff/StaffLabDesk.jsx";

import AdminOverview from "./pages/admin/AdminOverview.jsx";
import AdminBranches from "./pages/admin/AdminBranches.jsx";
import AdminStaff from "./pages/admin/AdminStaff.jsx";
import AdminReports from "./pages/admin/AdminReports.jsx";
import AdminAudit from "./pages/admin/AdminAudit.jsx";
import AdminConfig from "./pages/admin/AdminConfig.jsx";
import AdminFeedback from "./pages/admin/AdminFeedback.jsx";
import AdminDataRequests from "./pages/admin/AdminDataRequests.jsx";
import AdminDuplicatePatients from "./pages/admin/AdminDuplicatePatients.jsx";
import AdminBreakGlass from "./pages/admin/AdminBreakGlass.jsx";
import AdminBranchConfig from "./pages/admin/AdminBranchConfig.jsx";
import AdminPayments from "./pages/admin/AdminPayments.jsx";

const patientTabs = [
  { key: "home", label: "Home", icon: Home },
  { key: "find", label: "Doctors", icon: Search },
  { key: "appts", label: "Appts", icon: Calendar },
  { key: "records", label: "Records", icon: FileText },
  { key: "feedback", label: "Feedback", icon: MessageSquare },
  { key: "profile", label: "Profile", icon: User },
];

const doctorTabs = [
  { key: "schedule", label: "Schedule", icon: Calendar },
  { key: "requests", label: "Upcoming", icon: ClipboardList },
  { key: "patients", label: "Patients", icon: Users },
  { key: "profile", label: "Profile", icon: User },
];

const staffTabs = [
  { key: "appts", label: "Appts", icon: Calendar },
  { key: "vitals", label: "Vitals", icon: Activity },
  { key: "admissions", label: "Admissions", icon: ClipboardList },
  { key: "pharmacy", label: "Pharmacy", icon: Pill },
  { key: "labs", label: "Lab Desk", icon: FlaskConical },
  { key: "profile", label: "Profile", icon: User },
];

// Receptionist, Nurse, Pharmacist and Lab Technician all share the "staff"
// shell, but not the same API permissions — showing everyone every tab meant a
// Lab Technician opening Vitals or Pharmacy got a 403 error card. Each role
// sees only the screens its own role middleware actually allows.
const staffTabsByType = {
  receptionist: ["appts", "vitals", "admissions", "profile"],
  nurse: ["appts", "vitals", "admissions", "profile"],
  pharmacist: ["appts", "pharmacy", "profile"],
  lab_technician: ["appts", "labs", "profile"],
};

function tabsForStaff(staffType) {
  const allowed = staffTabsByType[staffType];
  if (!allowed) return staffTabs; // unknown staff type: fall back to everything
  return staffTabs.filter((t) => allowed.includes(t.key));
}

const adminTabs = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "branches", label: "Branches", icon: Building2 },
  { key: "staff", label: "Staff", icon: Users },
  { key: "config", label: "Config", icon: Settings },
  { key: "branchConfig", label: "Branch Config", icon: Building2 },
  { key: "feedback", label: "Feedback", icon: MessageSquare },
  { key: "dataRequests", label: "Data Requests", icon: FileEdit },
  { key: "duplicates", label: "Duplicates", icon: Users },
  { key: "breakGlass", label: "Break-Glass", icon: ShieldAlert },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "reports", label: "Reports", icon: TrendingUp },
  { key: "audit", label: "Audit log", icon: ShieldCheck },
];

export default function App() {
  const { user, booting, logout } = useAuth();
  const [showPublicSite, setShowPublicSite] = useState(true);

  const [patientScreen, setPatientScreen] = useState("home");
  const [doctorScreen, setDoctorScreen] = useState("schedule");
  const [staffScreen, setStaffScreen] = useState("appts");
  const [adminScreen, setAdminScreen] = useState("overview");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const role = user?.role ?? null;

  const visibleStaffTabs = tabsForStaff(user?.staffType);
  // Guards against a stored tab this role can't open (e.g. after switching users).
  const activeStaffScreen = visibleStaffTabs.some((t) => t.key === staffScreen)
    ? staffScreen
    : visibleStaffTabs[0]?.key;

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="f-body" style={{ color: "var(--muted)" }}>Loading St George HMS…</div>
      </div>
    );
  }

  // FR50: Admin/Branch Manager accounts must finish MFA enrolment before
  // reaching any other screen — matches RequireMfaSetup on the backend.
  if (role && user.requiresMfa && !user.mfaEnabled) {
    return <MfaSetup />;
  }

  return (
    <div className="f-body" style={{ minHeight: "100%", background: role ? "var(--mist)" : "transparent" }}>
      {!role && showPublicSite && (
        <PublicSite onEnterPortal={() => setShowPublicSite(false)} />
      )}
      {!role && !showPublicSite && (
        <div>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 20px 0" }}>
            <button
              onClick={() => setShowPublicSite(true)}
              className="f-body"
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
            >
              ← Back to Hospital Website
            </button>
          </div>
          <Login />
        </div>
      )}

      {role && <IdleTimer timeoutMinutes={10} onLogout={logout} />}

      <div className={role ? "app-stage" : undefined}>
        {role === "patient" && (
          <PhoneFrame
            role="patient"
            tabs={patientTabs}
            active={patientScreen}
            user={user}
            onTab={(k) => {
              setPatientScreen(k);
              setSelectedDoctor(null);
            }}
          >
            {patientScreen === "home" && (
              <PatientHome user={user} goBook={() => setPatientScreen("find")} onNavigate={setPatientScreen} />
            )}
            {patientScreen === "find" && !selectedDoctor && <PatientFind onSelect={setSelectedDoctor} user={user} />}
            {patientScreen === "find" && selectedDoctor && (
              <PatientDoctorProfile
                doctor={selectedDoctor}
                onBack={() => setSelectedDoctor(null)}
              />
            )}
            {patientScreen === "appts" && <PatientAppointments />}
            {patientScreen === "records" && <PatientRecords user={user} />}
            {patientScreen === "feedback" && <PatientFeedback />}
            {patientScreen === "profile" && <PatientProfile user={user} onLogout={logout} />}
          </PhoneFrame>
        )}

        {role === "doctor" && (
          <PhoneFrame role="doctor" tabs={doctorTabs} active={doctorScreen} onTab={setDoctorScreen} user={user}>
            {doctorScreen === "schedule" && <DoctorSchedule user={user} />}
            {doctorScreen === "requests" && <DoctorRequests user={user} />}
            {doctorScreen === "patients" && <DoctorPatients user={user} />}
            {doctorScreen === "profile" && <PatientProfile user={user} onLogout={logout} />}
          </PhoneFrame>
        )}

        {role === "staff" && (
          <PhoneFrame role="staff" tabs={visibleStaffTabs} active={activeStaffScreen} onTab={setStaffScreen} user={user}>
            {activeStaffScreen === "appts" && <StaffAppointments user={user} />}
            {activeStaffScreen === "vitals" && <StaffVitals user={user} />}
            {activeStaffScreen === "admissions" && <StaffAdmissions user={user} />}
            {activeStaffScreen === "pharmacy" && <StaffPharmacy user={user} />}
            {activeStaffScreen === "labs" && <StaffLabDesk user={user} />}
            {activeStaffScreen === "profile" && <PatientProfile user={user} onLogout={logout} />}
          </PhoneFrame>
        )}

        {role === "admin" && (
          <AdminShell tabs={adminTabs} active={adminScreen} onTab={setAdminScreen} onLogout={logout} user={user}>
            {adminScreen === "overview" && <AdminOverview user={user} />}
            {adminScreen === "branches" && <AdminBranches user={user} />}
            {adminScreen === "staff" && <AdminStaff user={user} />}
            {adminScreen === "config" && <AdminConfig />}
            {adminScreen === "branchConfig" && <AdminBranchConfig user={user} />}
            {adminScreen === "feedback" && <AdminFeedback />}
            {adminScreen === "dataRequests" && <AdminDataRequests />}
            {adminScreen === "duplicates" && <AdminDuplicatePatients />}
            {adminScreen === "breakGlass" && <AdminBreakGlass />}
            {adminScreen === "payments" && <AdminPayments user={user} />}
            {adminScreen === "reports" && <AdminReports user={user} />}
            {adminScreen === "audit" && <AdminAudit />}
          </AdminShell>
        )}
      </div>
    </div>
  );
}
