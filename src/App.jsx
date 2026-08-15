import React, { useState } from "react";
import { Home, Search, Calendar, FileText, User, ClipboardList, Users, Pill, Activity, BarChart3, Building2, TrendingUp, ShieldCheck, FlaskConical, Settings, MessageSquare } from "lucide-react";

import PhoneFrame from "./components/frames/PhoneFrame.jsx";
import AdminShell from "./components/frames/AdminShell.jsx";
import Login from "./components/auth/Login.jsx";
import PublicSite from "./components/public/PublicSite.jsx";

import PatientHome from "./components/patient/PatientHome.jsx";
import PatientFind from "./components/patient/PatientFind.jsx";
import PatientDoctorProfile from "./components/patient/PatientDoctorProfile.jsx";
import PatientAppointments from "./components/patient/PatientAppointments.jsx";
import PatientRecords from "./components/patient/PatientRecords.jsx";
import PatientProfile from "./components/patient/PatientProfile.jsx";
import PatientFeedback from "./components/patient/PatientFeedback.jsx";

import DoctorSchedule from "./components/doctor/DoctorSchedule.jsx";
import DoctorRequests from "./components/doctor/DoctorRequests.jsx";
import DoctorPatients from "./components/doctor/DoctorPatients.jsx";

import StaffAppointments from "./components/staff/StaffAppointments.jsx";
import StaffVitals from "./components/staff/StaffVitals.jsx";
import StaffPharmacy from "./components/staff/StaffPharmacy.jsx";
import StaffAdmissions from "./components/staff/StaffAdmissions.jsx";
import StaffLabDesk from "./components/staff/StaffLabDesk.jsx";

import AdminOverview from "./components/admin/AdminOverview.jsx";
import AdminBranches from "./components/admin/AdminBranches.jsx";
import AdminStaff from "./components/admin/AdminStaff.jsx";
import AdminReports from "./components/admin/AdminReports.jsx";
import AdminAudit from "./components/admin/AdminAudit.jsx";
import AdminConfig from "./components/admin/AdminConfig.jsx";
import AdminFeedback from "./components/admin/AdminFeedback.jsx";

import { SEED_ACCOUNTS } from "./data/accounts.js";
import { PHARMACY_STOCK, AUDIT_LOG, BRANCHES, STAFF_LIST, LAB_RESULTS, INVOICES, PATIENTS } from "./data/mockData.js";

export default function App() {
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS);
  const [session, setSession] = useState(null);
  const [showPublicSite, setShowPublicSite] = useState(true);
  const role = session?.role ?? null;

  // Centralized dynamic states
  const [branches, setBranches] = useState(BRANCHES);
  const [patients, setPatients] = useState(PATIENTS);
  const [staffList, setStaffList] = useState(STAFF_LIST);
  const [pharmacyStock, setPharmacyStock] = useState(PHARMACY_STOCK);
  
  const [appointments, setAppointments] = useState([
    { id: "APT-77410", patientId: "SGH-PT-88213", patientName: "Ravi Shah", doctor: "Dr. Amelia Chen", specialty: "Cardiology", date: "Today", time: "3:40 PM", status: "Confirmed", reason: "Regular checkup" },
    { id: "APT-77298", patientId: "SGH-PT-88213", patientName: "Ravi Shah", doctor: "Dr. Samuel Okoye", specialty: "General Practice", date: "18 Aug", time: "10:00 AM", status: "Pending", reason: "Routine consult" },
  ]);

  const [admissions, setAdmissions] = useState([
    { id: "ADM-1001", patientId: "SGH-PT-88213", patientName: "Ravi Shah", ward: "Cardiology A", bed: "Bed 14", admitDate: "14 Aug 2026", dischargeDate: "", status: "Admitted" }
  ]);

  const [labRequests, setLabRequests] = useState([
    { id: "LAB-3391", patientId: "SGH-PT-88213", patientName: "Ravi Shah", test: "Full Blood Count", date: "05 Aug 2026", requestedBy: "Dr. Amelia Chen", result: "WBC: 6.2k, RBC: 4.8m, Hgb: 14.2", status: "Ready" },
    { id: "LAB-3287", patientId: "SGH-PT-88213", patientName: "Ravi Shah", test: "Lipid Profile", date: "22 Jul 2026", requestedBy: "Dr. Amelia Chen", result: "Chol: 195, Trig: 140, HDL: 48, LDL: 119", status: "Ready" },
    { id: "LAB-3401", patientId: "SGH-PT-88213", patientName: "Ravi Shah", test: "ECG Stress Test", date: "Pending", requestedBy: "Dr. Amelia Chen", result: "", status: "In progress" }
  ]);

  const [prescriptions, setPrescriptions] = useState([
    { id: "PRC-2201", patientId: "SGH-PT-88213", patientName: "Ravi Shah", doctorName: "Dr. Amelia Chen", medicine: "Amoxicillin 500mg", dosage: "1 tab daily after food", date: "05 Aug 2026", status: "Active" }
  ]);

  const [invoices, setInvoices] = useState([
    { id: "INV-9931", patientId: "SGH-PT-88213", desc: "Cardiology consultation", date: "05 Aug 2026", amount: 180, status: "Paid" },
    { id: "INV-9880", patientId: "SGH-PT-88213", desc: "Lab tests · FBC + Lipid", date: "22 Jul 2026", amount: 95, status: "Paid" },
    { id: "INV-9905", patientId: "SGH-PT-88213", desc: "General practice consult", date: "18 Aug 2026", amount: 95, status: "Pending" }
  ]);

  const [systemConfig, setSystemConfig] = useState({
    apptDuration: "30",
    logoutTimer: "10",
    reminderHours: "2",
    backupSchedule: "Daily (02:00 AM)"
  });

  const [feedbacks, setFeedbacks] = useState([
    { id: "FB-10021", patientId: "SGH-PT-88213", patientName: "Ravi Shah", branch: "Kogarah", doctor: "Dr. Amelia Chen", category: "Doctor Communication", rating: 5, comment: "Excellent service, Dr. Chen was very professional and thorough", date: "10 Aug 2026", time: "2:15 PM" },
    { id: "FB-10022", patientId: "SGH-PT-90142", patientName: "Priya Nair", branch: "Hurstville", doctor: "General", category: "Waiting Time", rating: 3, comment: "Long wait time but the doctor was helpful once seen", date: "09 Aug 2026", time: "11:40 AM" },
    { id: "FB-10023", patientId: "SGH-PT-77012", patientName: "Leon Marsh", branch: "Parramatta", doctor: "General", category: "Facility Cleanliness", rating: 2, comment: "Very disappointed with the waiting room cleanliness", date: "07 Aug 2026", time: "4:05 PM" },
  ]);

  const [auditLogs, setAuditLogs] = useState(AUDIT_LOG);
  const [vitals, setVitals] = useState({
    "SGH-PT-88213": { bp: "128/82 mmHg", hr: "76 bpm", temp: "36.8°C", spo2: "98%" }
  });

  const [patientScreen, setPatientScreen] = useState("home");
  const [doctorScreen, setDoctorScreen] = useState("schedule");
  const [staffScreen, setStaffScreen] = useState("appts");
  const [adminScreen, setAdminScreen] = useState("overview");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Helper helper to append logs
  function addLog(action, target, outcome = "Success") {
    const time = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    const userEmail = session?.email ?? "system/guest";
    setAuditLogs((prev) => [
      { user: userEmail, action, target, time, outcome },
      ...prev
    ]);
  }

  // Handlers
  function handleLogin(account) {
    setSession(account);
    const time = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    setAuditLogs((prev) => [
      { user: account.email, action: "User login success", target: account.role, time, outcome: "Success" },
      ...prev
    ]);
  }

  function handleRegister(newAccount) {
    setAccounts((prev) => [...prev, newAccount]);
    
    // Add to patient master list too
    const newPt = {
      id: newAccount.patientId,
      name: newAccount.name,
      dob: newAccount.dob,
      gender: newAccount.gender,
      branch: newAccount.branch,
      allergies: "None declared (self-registered)"
    };
    setPatients((prev) => [...prev, newPt]);
    setSession(newAccount);

    const time = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    setAuditLogs((prev) => [
      { user: newAccount.email, action: "New patient registration", target: newAccount.patientId, time, outcome: "Success" },
      ...prev
    ]);
  }

  function handleLogout() {
    addLog("User logout", session?.role ?? "");
    setSession(null);
    setSelectedDoctor(null);
    setPatientScreen("home");
    setDoctorScreen("schedule");
    setStaffScreen("appts");
    setAdminScreen("overview");
    setShowPublicSite(true);
  }

  // Book appointment handler
  function handleBookAppointment(doctorObj, date, timeVal) {
    const newId = `APT-${Math.floor(10000 + Math.random() * 89999)}`;
    const newAppt = {
      id: newId,
      patientId: session?.patientId ?? "SGH-PT-88213",
      patientName: session?.name ?? "Ravi Shah",
      doctor: doctorObj.name,
      specialty: doctorObj.specialty,
      date,
      time: timeVal,
      status: "Pending",
      reason: "Requested via Patient App"
    };
    setAppointments((prev) => [...prev, newAppt]);
    addLog("Booked appointment request", `${doctorObj.name} · ${timeVal}`);
  }

  // Doctor handles appointment
  function handleDoctorDecision(id, decision) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: decision === "accept" ? "Confirmed" : "Cancelled" } : a))
    );
    const matched = appointments.find((a) => a.id === id);
    if (decision === "accept" && matched) {
      // Add invoice automatically for consultation
      const newInv = {
        id: `INV-${Math.floor(1000 + Math.random() * 8999)}`,
        patientId: matched.patientId,
        desc: `${matched.doctor} Consultation`,
        date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
        amount: 180, // Consultation standard charge
        status: "Pending"
      };
      setInvoices((prev) => [...prev, newInv]);
    }
    addLog(`Appointment request ${decision}ed`, id);
  }

  // Admissions handlers
  function handleAdmit({ patientId, patientName, ward, bed }) {
    const newId = `ADM-${Math.floor(1000 + Math.random() * 8999)}`;
    const newAdm = {
      id: newId,
      patientId,
      patientName,
      ward,
      bed,
      admitDate: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
      dischargeDate: "",
      status: "Admitted"
    };
    setAdmissions((prev) => [newAdm, ...prev]);
    addLog("Admitted patient to ward", `${patientId} -> ${ward} (${bed})`);
  }

  function handleDischarge(id) {
    setAdmissions((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "Discharged",
              dischargeDate: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
            }
          : a
      )
    );
    addLog("Discharged patient from ward", id);
  }

  // Lab handlers
  function handleRequestLab(patientObj, testType) {
    const newId = `LAB-${Math.floor(1000 + Math.random() * 8999)}`;
    const newReq = {
      id: newId,
      patientId: patientObj.id,
      patientName: patientObj.name,
      test: testType,
      date: "Pending",
      requestedBy: session?.name ?? "Dr. Amelia Chen",
      result: "",
      status: "In progress"
    };
    setLabRequests((prev) => [newReq, ...prev]);
    
    // Add invoice for lab test
    const newInv = {
      id: `INV-${Math.floor(1000 + Math.random() * 8999)}`,
      patientId: patientObj.id,
      desc: `Diagnostic lab test: ${testType}`,
      date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
      amount: 95,
      status: "Pending"
    };
    setInvoices((prev) => [...prev, newInv]);

    addLog("Requested laboratory test", `${patientObj.id} · ${testType}`);
  }

  function handleUpdateLab(id, updates) {
    setLabRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
    addLog("Uploaded laboratory results", id);
  }

  // Prescriptions handler
  function handleWritePrescription(patientObj, medicineName, dosageVal) {
    const newId = `PRC-${Math.floor(1000 + Math.random() * 8999)}`;
    const newPrc = {
      id: newId,
      patientId: patientObj.id,
      patientName: patientObj.name,
      doctorName: session?.name ?? "Dr. Amelia Chen",
      medicine: medicineName,
      dosage: dosageVal,
      date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
      status: "Active"
    };
    setPrescriptions((prev) => [newPrc, ...prev]);

    addLog("Prescribed drug to patient", `${patientObj.id} · ${medicineName}`);
  }

  // Pharmacy actions
  function handleDispense(medName, patientId) {
    // Deduct stock quantity
    setPharmacyStock((prev) =>
      prev.map((item) => {
        if (item.name === medName) {
          const newQty = Math.max(0, item.qty - 1);
          let newStatus = "OK";
          if (newQty <= item.min * 0.5) newStatus = "Critical";
          else if (newQty <= item.min) newStatus = "Low";
          return { ...item, qty: newQty, status: newStatus };
        }
        return item;
      })
    );

    // Charge patient for medication
    const newInv = {
      id: `INV-${Math.floor(1000 + Math.random() * 8999)}`,
      patientId,
      desc: `Pharmacy medication: ${medName}`,
      date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
      amount: 35,
      status: "Pending"
    };
    setInvoices((prev) => [...prev, newInv]);

    // Deactivate prescription once dispensed
    setPrescriptions((prev) =>
      prev.map((p) => (p.patientId === patientId && p.medicine === medName ? { ...p, status: "Dispensed" } : p))
    );

    addLog("Dispensed prescription medication", `${patientId} · ${medName}`);
  }

  function handleRestock(medName) {
    setPharmacyStock((prev) =>
      prev.map((item) => {
        if (item.name === medName) {
          return { ...item, qty: item.min + 150, status: "OK" };
        }
        return item;
      })
    );
    addLog("Simulated inventory restock request", medName);
  }

  // Invoice payment
  function handlePayInvoice(id) {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "Paid" } : inv))
    );
    addLog("Processed online payment transaction", id);
  }

  // Feedback (FR47)
  function handleSubmitFeedback(fb) {
    setFeedbacks((prev) => [fb, ...prev]);
    addLog("Submitted patient feedback", `${fb.rating}★ · ${fb.category}`);
  }

  // Config triggers
  function handleUpdateConfig(newCfg) {
    setSystemConfig(newCfg);
    addLog("Updated system parameters", "Central config");
  }

  function handleTriggerBackup(filename) {
    addLog("Simulated database backup run", filename);
  }

  // Admin staff management
  function handleAddStaff(stf) {
    const newStf = {
      name: stf.name,
      role: stf.role,
      branch: stf.branch,
      status: "Active"
    };
    setStaffList((prev) => [...prev, newStf]);
    addLog("Created new staff profile", stf.name);
  }

  function handleToggleStaff(index) {
    setStaffList((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, status: s.status === "Active" ? "Deactivated" : "Active" } : s))
    );
    const stf = staffList[index];
    addLog(`Changed staff status to ${stf.status === "Active" ? "Deactivated" : "Active"}`, stf.name);
  }

  // Admin branch management
  function handleAddBranch(br) {
    const newBr = {
      id: `STG-${br.name.substring(0, 3).toUpperCase()}`,
      name: br.name,
      state: br.state,
      patients: 0,
      revenue: 0,
      beds: parseInt(br.beds || "100"),
      occupancy: 0
    };
    setBranches((prev) => [...prev, newBr]);
    addLog("Created new branch profile", br.name);
  }

  // Compute stats dynamically
  const computedBranches = branches.map((b) => {
    const activeAdmissions = admissions.filter((a) => a.status === "Admitted" && a.ward.toLowerCase().includes(b.name.toLowerCase() === "kogarah" ? "cardiology" : "general")); 
    // Just mock occupancy percentages based on beds
    const currentAdmittedCount = b.name === "Kogarah" ? activeAdmissions.length : Math.round(b.beds * (b.occupancy / 100));
    const newOcc = Math.min(100, Math.round((currentAdmittedCount / b.beds) * 100));
    return {
      ...b,
      occupancy: newOcc
    };
  });

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
    { key: "requests", label: "Requests", icon: ClipboardList },
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

  const adminTabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "branches", label: "Branches", icon: Building2 },
    { key: "staff", label: "Staff", icon: Users },
    { key: "config", label: "Config", icon: Settings },
    { key: "feedback", label: "Feedback", icon: MessageSquare },
    { key: "reports", label: "Reports", icon: TrendingUp },
    { key: "audit", label: "Audit log", icon: ShieldCheck },
  ];

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
          <Login accounts={accounts} onLogin={handleLogin} onRegister={handleRegister} />
        </div>
      )}

      <div style={{ padding: role ? "28px 16px" : 0 }}>
        {role === "patient" && (
          <PhoneFrame
            role="patient"
            tabs={patientTabs}
            active={patientScreen}
            onTab={(k) => {
              setPatientScreen(k);
              setSelectedDoctor(null);
            }}
          >
            {patientScreen === "home" && (
              <PatientHome
                user={session}
                goBook={() => setPatientScreen("find")}
                appointments={appointments.filter((a) => a.patientId === session?.patientId)}
              />
            )}
            {patientScreen === "find" && !selectedDoctor && <PatientFind onSelect={setSelectedDoctor} />}
            {patientScreen === "find" && selectedDoctor && (
              <PatientDoctorProfile
                doctor={selectedDoctor}
                onBack={() => setSelectedDoctor(null)}
                onBooked={(apptData) => {
                  handleBookAppointment(selectedDoctor, apptData.date, apptData.time);
                }}
              />
            )}
            {patientScreen === "appts" && (
              <PatientAppointments
                appointments={appointments.filter((a) => a.patientId === session?.patientId)}
              />
            )}
            {patientScreen === "records" && (
              <PatientRecords
                user={session}
                labRequests={labRequests.filter((l) => l.patientId === session?.patientId)}
                prescriptions={prescriptions.filter((p) => p.patientId === session?.patientId)}
                invoices={invoices.filter((i) => i.patientId === session?.patientId)}
                onPayInvoice={handlePayInvoice}
              />
            )}
            {patientScreen === "feedback" && (
              <PatientFeedback user={session} onSubmit={handleSubmitFeedback} />
            )}
            {patientScreen === "profile" && <PatientProfile user={session} onLogout={handleLogout} />}
          </PhoneFrame>
        )}

        {role === "doctor" && (
          <PhoneFrame role="doctor" tabs={doctorTabs} active={doctorScreen} onTab={setDoctorScreen}>
            {doctorScreen === "schedule" && (
              <DoctorSchedule
                appointments={appointments.filter((a) => a.doctor === session?.name && a.status === "Confirmed")}
              />
            )}
            {doctorScreen === "requests" && (
              <DoctorRequests
                appointments={appointments.filter((a) => a.doctor === session?.name && a.status === "Pending")}
                onDecision={handleDoctorDecision}
              />
            )}
            {doctorScreen === "patients" && (
              <DoctorPatients
                patients={patients}
                vitals={vitals}
                onAddLabRequest={handleRequestLab}
                onAddPrescription={handleWritePrescription}
              />
            )}
            {doctorScreen === "profile" && <PatientProfile user={session} onLogout={handleLogout} />}
          </PhoneFrame>
        )}

        {role === "staff" && (
          <PhoneFrame role="staff" tabs={staffTabs} active={staffScreen} onTab={setStaffScreen}>
            {staffScreen === "appts" && (
              <StaffAppointments
                appointments={appointments}
              />
            )}
            {staffScreen === "vitals" && (
              <StaffVitals
                patients={patients}
                vitals={vitals}
                onSaveVitals={(pid, vit) => {
                  setVitals((prev) => ({ ...prev, [pid]: vit }));
                  addLog("Recorded patient vitals", pid);
                }}
              />
            )}
            {staffScreen === "admissions" && (
              <StaffAdmissions
                admissions={admissions}
                patients={patients}
                onAdmit={handleAdmit}
                onDischarge={handleDischarge}
              />
            )}
            {staffScreen === "pharmacy" && (
              <StaffPharmacy
                stock={pharmacyStock}
                prescriptions={prescriptions}
                onDispense={handleDispense}
                onRestock={handleRestock}
              />
            )}
            {staffScreen === "labs" && (
              <StaffLabDesk
                labRequests={labRequests}
                onUpdateLab={handleUpdateLab}
              />
            )}
            {staffScreen === "profile" && <PatientProfile user={session} onLogout={handleLogout} />}
          </PhoneFrame>
        )}

        {role === "admin" && (
          <AdminShell tabs={adminTabs} active={adminScreen} onTab={setAdminScreen} onLogout={handleLogout} user={session}>
            {adminScreen === "overview" && (
              <AdminOverview
                branches={computedBranches}
              />
            )}
            {adminScreen === "branches" && (
              <AdminBranches
                branches={computedBranches}
                onAddBranch={handleAddBranch}
              />
            )}
            {adminScreen === "staff" && (
              <AdminStaff
                staff={staffList}
                branches={computedBranches}
                onAddStaff={handleAddStaff}
                onToggleStatus={handleToggleStaff}
              />
            )}
            {adminScreen === "config" && (
              <AdminConfig
                config={systemConfig}
                onUpdateConfig={handleUpdateConfig}
                onTriggerBackup={handleTriggerBackup}
              />
            )}
            {adminScreen === "feedback" && (
              <AdminFeedback feedbacks={feedbacks} />
            )}
            {adminScreen === "reports" && (
              <AdminReports
                branches={computedBranches}
              />
            )}
            {adminScreen === "audit" && (
              <AdminAudit
                logs={auditLogs}
              />
            )}
          </AdminShell>
        )}
      </div>
    </div>
  );
}