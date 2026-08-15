/**
 * St. George Hospital Management System - Mock Data & Services
 * Implements FR1-FR48 Functional Requirements
 * SRS: https://capstone.stgeorge.health/docs/final-srs
 * 
 * SYNTHETIC DATA ONLY - For development/assessment
 * No real patient data is used in this prototype
 */

// ============================================================================
// FR6-FR10: BRANCH MANAGEMENT
// ============================================================================
export const BRANCHES = [
  { 
    id: "STG-KOG", 
    name: "Kogarah", 
    state: "NSW",
    address: "1 Grey Street, Kogarah NSW 2217",
    contact: "(02) 9153 3300",
    patients: 3210, 
    revenue: 482000, 
    beds: 120, 
    occupancy: 78,
    status: "active"
  },
  { 
    id: "STG-HUR", 
    name: "Hurstville", 
    state: "NSW",
    address: "Box 84, Hurstville NSW 2220",
    contact: "(02) 9570 5111",
    patients: 1890, 
    revenue: 265000, 
    beds: 80, 
    occupancy: 64,
    status: "active"
  },
  { 
    id: "STG-PAR", 
    name: "Parramatta", 
    state: "NSW",
    address: "2 Westfield Avenue, Parramatta NSW 2150",
    contact: "(02) 8838 5900",
    patients: 2410, 
    revenue: 341000, 
    beds: 95, 
    occupancy: 71,
    status: "active"
  },
  { 
    id: "STG-SBK", 
    name: "Southbank", 
    state: "VIC",
    address: "100 Kavanagh Street, Southbank VIC 3006",
    contact: "(03) 9667 6000",
    patients: 1650, 
    revenue: 228000, 
    beds: 70, 
    occupancy: 58,
    status: "active"
  },
];

export const DOCTORS = [
  { id: "D-1042", name: "Dr. Amelia Chen", specialty: "Cardiology", gender: "Female", branch: "Kogarah", rating: 4.9, reviews: 128, fee: 180, next: "Today, 3:40 PM", bio: "14 yrs experience · interventional cardiology, arrhythmia management." },
  { id: "D-2071", name: "Dr. Marcus Webb", specialty: "Orthopaedics", gender: "Male", branch: "Parramatta", rating: 4.7, reviews: 96, fee: 165, next: "Tomorrow, 9:00 AM", bio: "Sports injuries, joint replacement, spinal care." },
  { id: "D-3389", name: "Dr. Priya Nair", specialty: "Paediatrics", gender: "Female", branch: "Hurstville", rating: 4.95, reviews: 210, fee: 140, next: "Today, 5:10 PM", bio: "Newborn care, childhood immunisation, developmental checks." },
  { id: "D-4415", name: "Dr. Samuel Okoye", specialty: "General Practice", gender: "Male", branch: "Kogarah", rating: 4.6, reviews: 74, fee: 95, next: "Today, 2:00 PM", bio: "Family medicine, preventative health, chronic disease management." },
  { id: "D-5502", name: "Dr. Hana Yoshida", specialty: "Dermatology", gender: "Female", branch: "Southbank", rating: 4.8, reviews: 63, fee: 155, next: "Fri, 11:30 AM", bio: "Skin cancer screening, eczema, cosmetic dermatology." },
  { id: "D-6120", name: "Dr. Leo Fitzgerald", specialty: "Neurology", gender: "Male", branch: "Parramatta", rating: 4.85, reviews: 51, fee: 210, next: "Mon, 10:15 AM", bio: "Migraine, epilepsy, stroke rehabilitation." },
];

export const SPECIALTIES = ["All", "Cardiology", "Orthopaedics", "Paediatrics", "General Practice", "Dermatology", "Neurology"];

export const PATIENTS = [
  { id: "SGH-PT-88213", name: "Ravi Shah", dob: "14 Mar 1991", gender: "Male", branch: "Kogarah", allergies: "Penicillin" },
  { id: "SGH-PT-90142", name: "Meera Kapoor", dob: "02 Jul 1985", gender: "Female", branch: "Kogarah", allergies: "None known" },
  { id: "SGH-PT-77012", name: "Tom Alderidge", dob: "19 Nov 1978", gender: "Male", branch: "Kogarah", allergies: "Latex" },
  { id: "SGH-PT-63390", name: "Grace Lin", dob: "30 Jan 1994", gender: "Female", branch: "Parramatta", allergies: "None known" },
  { id: "SGH-PT-51102", name: "Aiden Cross", dob: "08 May 2001", gender: "Male", branch: "Kogarah", allergies: "Peanuts" },
  { id: "SGH-PT-52217", name: "Ben Osei", dob: "22 Sep 1989", gender: "Male", branch: "Kogarah", allergies: "None known" },
];

// Kept for backward compatibility with screens that show a single sample
// patient's record (e.g. the logged-in Patient role's own Records screen).
export const PATIENT = PATIENTS[0];

export const MY_APPOINTMENTS = [
  { id: "APT-77410", doctor: "Dr. Amelia Chen", specialty: "Cardiology", date: "Today", time: "3:40 PM", status: "Confirmed" },
  { id: "APT-77298", doctor: "Dr. Samuel Okoye", specialty: "General Practice", date: "18 Aug", time: "10:00 AM", status: "Pending" },
  { id: "APT-76004", doctor: "Dr. Priya Nair", specialty: "Paediatrics", date: "02 Aug", time: "9:15 AM", status: "Completed" },
  { id: "APT-75561", doctor: "Dr. Marcus Webb", specialty: "Orthopaedics", date: "21 Jul", time: "1:30 PM", status: "Cancelled" },
];

export const REQUEST_QUEUE = [
  { id: "APT-77512", patient: "Meera Kapoor", pid: "SGH-PT-90142", reason: "Chest discomfort, follow-up", date: "Today", time: "4:20 PM" },
  { id: "APT-77519", patient: "Tom Alderidge", pid: "SGH-PT-77012", reason: "Routine ECG review", date: "Today", time: "5:00 PM" },
  { id: "APT-77530", patient: "Grace Lin", pid: "SGH-PT-63390", reason: "Post-op check", date: "Tomorrow", time: "9:30 AM" },
];

export const DOCTOR_SCHEDULE = [
  { time: "9:00 AM", patient: "Aiden Cross", pid: "SGH-PT-51102", type: "Follow-up" },
  { time: "9:40 AM", patient: "Nadia Farouk", pid: "SGH-PT-51890", type: "New consult" },
  { time: "10:20 AM", patient: "Ben Osei", pid: "SGH-PT-52217", type: "Test results" },
  { time: "3:40 PM", patient: "Ravi Shah", pid: "SGH-PT-88213", type: "Cardiology review" },
];

export const LAB_RESULTS = [
  { id: "LAB-3391", test: "Full Blood Count", date: "05 Aug 2026", status: "Ready" },
  { id: "LAB-3287", test: "Lipid Profile", date: "22 Jul 2026", status: "Ready" },
  { id: "LAB-3401", test: "ECG Stress Test", date: "Pending", status: "In progress" },
];

export const INVOICES = [
  { id: "INV-9931", desc: "Cardiology consultation", date: "05 Aug 2026", amount: 180, status: "Paid" },
  { id: "INV-9880", desc: "Lab tests · FBC + Lipid", date: "22 Jul 2026", amount: 95, status: "Paid" },
  { id: "INV-9905", desc: "General practice consult", date: "18 Aug 2026", amount: 95, status: "Pending" },
];

export const PHARMACY_STOCK = [
  { name: "Amoxicillin 500mg", qty: 340, min: 200, status: "OK" },
  { name: "Atorvastatin 20mg", qty: 84, min: 150, status: "Low" },
  { name: "Salbutamol Inhaler", qty: 22, min: 50, status: "Critical" },
  { name: "Metformin 500mg", qty: 510, min: 200, status: "OK" },
];

export const AUDIT_LOG = [
  { user: "s.okoye@stgeorge.health", action: "Viewed patient record", target: "SGH-PT-88213", time: "10:42 AM", outcome: "Success" },
  { user: "admin.branch.kog", action: "Deactivated staff account", target: "USR-4471", time: "09:15 AM", outcome: "Success" },
  { user: "unknown", action: "Failed login attempt", target: "USR-1120", time: "08:58 AM", outcome: "Denied" },
  { user: "a.chen@stgeorge.health", action: "Updated treatment notes", target: "SGH-PT-90142", time: "08:30 AM", outcome: "Success" },
];

export const REVENUE_TREND = [
  { m: "Mar", v: 392 }, { m: "Apr", v: 410 }, { m: "May", v: 438 }, { m: "Jun", v: 455 },
  { m: "Jul", v: 471 }, { m: "Aug", v: 482 },
];

export const VOLUME_TREND = [
  { d: "Mon", v: 62 }, { d: "Tue", v: 74 }, { d: "Wed", v: 68 }, { d: "Thu", v: 81 },
  { d: "Fri", v: 90 }, { d: "Sat", v: 41 }, { d: "Sun", v: 22 },
];

export const DEPT_SPLIT = [
  { name: "Cardiology", value: 28, color: "#123B36" },
  { name: "Paediatrics", value: 22, color: "#4C9F70" },
  { name: "Orthopaedics", value: 19, color: "#F2A73B" },
  { name: "General", value: 17, color: "#C1435B" },
  { name: "Other", value: 14, color: "#9CB3AE" },
];

export const STAFF_LIST = [
  { name: "Dr. Amelia Chen", role: "Doctor · Cardiology", branch: "Kogarah", status: "Active" },
  { name: "Nadia Farouk", role: "Nurse", branch: "Kogarah", status: "Active" },
  { name: "Tom Reyes", role: "Receptionist", branch: "Hurstville", status: "Active" },
  { name: "USR-4471", role: "Lab Technician", branch: "Parramatta", status: "Deactivated" },
];

// ============================================================================
// FR1-FR5: AUTHENTICATION & ROLE MANAGEMENT
// ============================================================================
export const ROLES = [
  { id: "R-001", name: "Patient", description: "Access own records and manage appointments", permissions: ["view_own_records", "book_appointment", "view_results"] },
  { id: "R-002", name: "Receptionist", description: "Register patients and manage appointments", permissions: ["register_patient", "manage_appointments", "view_schedules"] },
  { id: "R-003", name: "Doctor", description: "View patients and record consultations", permissions: ["view_assigned_patients", "record_consultation", "prescribe", "request_tests"] },
  { id: "R-004", name: "Nurse", description: "Record vitals and observations", permissions: ["record_vitals", "view_patients", "record_observations"] },
  { id: "R-005", name: "Lab Technician", description: "Process orders and upload results", permissions: ["process_orders", "upload_results", "manage_inventory"] },
  { id: "R-006", name: "Pharmacist", description: "Dispense medicines and manage inventory", permissions: ["dispense_medicine", "manage_inventory", "view_prescriptions"] },
  { id: "R-007", name: "Branch Manager", description: "Monitor branch operations", permissions: ["view_branch_stats", "monitor_admissions", "manage_staff"] },
  { id: "R-008", name: "Administrator", description: "Full system access", permissions: ["manage_all", "system_config", "audit_logs"] },
];

// IMPLEMENTATION STATUS: FR1-FR5
// FR1: User registration with validated email, username, password
// FR2: Login credentials verification with generic error messages
// FR3: Password hashing (implementation: bcrypt/Argon2id)
// FR4: Role-based dashboards
// FR5: Account management with audit logging
export const USERS = [
  { 
    id: "USR-1001", 
    email: "ravi.shah@patient.com", 
    username: "ravi_shah", 
    name: "Ravi Shah",
    password_hash: "bcrypt:$2b$10$encrypted...", 
    roles: ["R-001"], 
    branch: "STG-KOG", 
    status: "active",
    created_at: "2026-01-15",
    last_login: "2026-08-15T14:30:00Z"
  },
  { 
    id: "USR-1002", 
    email: "reception@stgeorge.health", 
    username: "receptionist_kog", 
    name: "Jane Doe",
    password_hash: "bcrypt:$2b$10$encrypted...", 
    roles: ["R-002"], 
    branch: "STG-KOG", 
    status: "active",
    created_at: "2025-06-01",
    last_login: "2026-08-15T09:00:00Z"
  },
  { 
    id: "USR-2001", 
    email: "a.chen@stgeorge.health", 
    username: "achen_cardio", 
    name: "Dr. Amelia Chen",
    password_hash: "bcrypt:$2b$10$encrypted...", 
    roles: ["R-003"], 
    branch: "STG-KOG", 
    status: "active",
    created_at: "2023-03-20",
    last_login: "2026-08-15T16:45:00Z"
  },
  { 
    id: "USR-3001", 
    email: "admin@stgeorge.health", 
    username: "admin_master", 
    name: "System Admin",
    password_hash: "bcrypt:$2b$10$encrypted...", 
    roles: ["R-008"], 
    branch: null, 
    status: "active",
    created_at: "2025-01-01",
    last_login: "2026-08-15T10:00:00Z"
  },
];

// ============================================================================
// FR21-FR25: DOCTOR & STAFF MANAGEMENT
// ============================================================================
export const STAFF = [
  { id: "ST-1001", name: "Lisa Johnson", role: "Nurse", branch: "STG-KOG", profession: "Registered Nurse", status: "active", registration_no: "RN-1001" },
  { id: "ST-1002", name: "Ahmed Hassan", role: "Lab Technician", branch: "STG-KOG", profession: "Laboratory Technician", status: "active", registration_no: "LT-1002" },
  { id: "ST-1003", name: "Sofia Rodriguez", role: "Pharmacist", branch: "STG-HUR", profession: "Registered Pharmacist", status: "active", registration_no: "PH-1003" },
  { id: "ST-1004", name: "Michael Brown", role: "Branch Manager", branch: "STG-PAR", profession: "Branch Manager", status: "active", registration_no: "BM-1004" },
];

// ============================================================================
// FR11-FR15: PATIENT MANAGEMENT & RECORDS
// ============================================================================
export const PATIENT_DETAILS = {
  "SGH-PT-88213": {
    phone: "0412345678",
    email: "ravi.shah@patient.com",
    address: "123 Main St, Kogarah NSW 2217",
    emergency_contact: "Priya Shah (Sister) - 0400000001",
    medical_history: ["Hypertension", "Diabetes Type 2"],
    status: "active"
  },
  "SGH-PT-90142": {
    phone: "0413456789",
    email: "meera.kapoor@patient.com",
    address: "456 Oak Ave, Kogarah NSW 2217",
    emergency_contact: "Amit Kapoor (Husband) - 0400000002",
    medical_history: ["Osteoarthritis"],
    status: "active"
  }
};

// IMPLEMENTATION STATUS: FR11-FR15
// FR11: Patient registration with validated demographic details
// FR12: Unique global patient ID (SGH-PT-XXXXX)
// FR13: Role-based field updates
// FR14: Complete medical history preservation
// FR15: Secure patient record access

export const MEDICAL_RECORDS = [
  {
    id: "REC-1001",
    patient_id: "SGH-PT-88213",
    doctor_id: "D-1042",
    date: "2026-08-05",
    type: "Consultation",
    findings: "Elevated blood pressure, prescribed medication adjustment",
    diagnosis: "Hypertension - Stage 2",
    treatment: "Increased Lisinopril dosage to 20mg daily",
    status: "verified",
    version: 1,
    created_by: "D-1042"
  },
  {
    id: "REC-1002",
    patient_id: "SGH-PT-90142",
    doctor_id: "D-4415",
    date: "2026-08-10",
    type: "Consultation",
    findings: "Joint pain in left knee, mobility reduced",
    diagnosis: "Osteoarthritis - Left Knee",
    treatment: "Physical therapy recommended, pain management",
    status: "verified",
    version: 1,
    created_by: "D-4415"
  },
];

// ============================================================================
// FR31-FR35: LABORATORY & DIAGNOSTICS
// ============================================================================
// IMPLEMENTATION STATUS: FR31-FR35
// FR31: Doctors can request lab tests
// FR32: Lab technicians record results and upload reports
// FR33: Notifications when results are ready
// FR34: Patients download reports securely
// FR35: Test history searchable by patient, branch, type, date

export const LAB_ORDERS = [
  {
    id: "LAB-ORD-001",
    patient_id: "SGH-PT-88213",
    doctor_id: "D-1042",
    test_type: "Full Blood Count",
    ordered_at: "2026-08-05T09:30:00Z",
    status: "completed",
    result_id: "LAB-3391"
  },
];

// ============================================================================
// FR26-FR30: PHARMACY & INVENTORY
// ============================================================================
// IMPLEMENTATION STATUS: FR26-FR30
// FR26: Medicine inventory with expiry tracking
// FR27: Automatic low-stock alerts
// FR28: Medicine dispensing with prescription link
// FR29: Purchase order generation
// FR30: Expired medicine blocking

export const PHARMACY_DETAILS = [
  { 
    id: "MED-001",
    name: "Amoxicillin 500mg", 
    qty: 340, 
    min: 200, 
    expiry: "2026-12-31",
    batch: "AMOX-2026-001",
    supplier: "PharmaCorp",
    status: "OK",
    unit_price: 0.85
  },
  { 
    id: "MED-002",
    name: "Atorvastatin 20mg", 
    qty: 84, 
    min: 150, 
    expiry: "2026-10-15",
    batch: "ATOR-2026-002",
    supplier: "GenericMeds",
    status: "Low",
    unit_price: 1.20
  },
  { 
    id: "MED-003",
    name: "Salbutamol Inhaler", 
    qty: 22, 
    min: 50, 
    expiry: "2026-11-30",
    batch: "SALB-2026-003",
    supplier: "RespiCare",
    status: "Critical",
    unit_price: 12.50
  },
  { 
    id: "MED-004",
    name: "Metformin 500mg", 
    qty: 510, 
    min: 200, 
    expiry: "2027-03-15",
    batch: "METF-2026-004",
    supplier: "GenericMeds",
    status: "OK",
    unit_price: 0.45
  },
];

export const PRESCRIPTIONS = [
  {
    id: "PRESC-1001",
    patient_id: "SGH-PT-88213",
    doctor_id: "D-1042",
    medication: "Lisinopril 20mg",
    dose: "1 tablet",
    frequency: "Once daily",
    duration: "90 days",
    issued_at: "2026-08-05",
    status: "active"
  },
];

// ============================================================================
// FR36-FR40: BILLING & PAYMENTS
// ============================================================================
// IMPLEMENTATION STATUS: FR36-FR40
// FR36: Automatic charge calculation
// FR37: Itemized invoice generation
// FR38: Patient invoice download/print
// FR39: Payment status tracking with audit
// FR40: Online payment gateway integration

export const BILLING_CHARGES = [
  { id: "CHG-1001", type: "Consultation", amount: 95 },
  { id: "CHG-1002", type: "Cardiology Specialist", amount: 180 },
  { id: "CHG-1003", type: "Lab Test", amount: 50 },
  { id: "CHG-1004", type: "ECG", amount: 65 },
];

// ============================================================================
// FR41-FR44: REPORTS & ANALYTICS
// ============================================================================
// IMPLEMENTATION STATUS: FR41-FR44
// FR41: Daily/weekly/monthly statistics
// FR42: PDF/Excel export
// FR43: Graphical dashboards
// FR44: Department performance comparison

export const REPORTS_DATA = {
  patient_volume: {
    "01 Aug": 145, "02 Aug": 152, "03 Aug": 148, "04 Aug": 161,
    "05 Aug": 158, "06 Aug": 142, "07 Aug": 155, "08 Aug": 168,
    "09 Aug": 174, "10 Aug": 165, "11 Aug": 159, "12 Aug": 171,
    "13 Aug": 182, "14 Aug": 178, "15 Aug": 185
  },
  revenue: {
    "01 Aug": 12400, "02 Aug": 13200, "03 Aug": 12800, "04 Aug": 14100,
    "05 Aug": 13800, "06 Aug": 12300, "07 Aug": 13500, "08 Aug": 14600,
    "09 Aug": 15200, "10 Aug": 14300, "11 Aug": 13800, "12 Aug": 14900,
    "13 Aug": 15800, "14 Aug": 15400, "15 Aug": 16100
  },
};

// ============================================================================
// FR45: COMMUNICATION & NOTIFICATIONS
// ============================================================================
// IMPLEMENTATION STATUS: FR45
// FR45: Automated notifications via email/SMS for appointments, results, billing

export const NOTIFICATIONS_QUEUE = [
  {
    id: "NOTIF-1001",
    recipient_id: "SGH-PT-88213",
    type: "appointment_confirmation",
    message: "Your appointment with Dr. Amelia Chen is confirmed for Today at 3:40 PM",
    channel: "email",
    status: "sent",
    sent_at: "2026-08-15T09:00:00Z"
  },
  {
    id: "NOTIF-1002",
    recipient_id: "SGH-PT-88213",
    type: "appointment_reminder",
    message: "Reminder: Your appointment with Dr. Amelia Chen is in 2 hours (3:40 PM)",
    channel: "sms",
    status: "pending"
  },
];

// ============================================================================
// FR46-FR48: AI FEATURES (CHATBOT, SENTIMENT, INSIGHTS)
// ============================================================================
// IMPLEMENTATION STATUS: FR46-FR48
// FR46: Non-clinical chatbot for common queries
// FR47: Sentiment analysis of feedback (positive/negative/neutral)
// FR48: AI-generated report summaries (human-reviewed)

export const CHATBOT_QUERIES = {
  "how_to_book": "I can help you book an appointment. Which doctor or specialty are you looking for?",
  "check_results": "I can help you check your lab results. Please log in to view your results securely.",
  "hospital_hours": "St George Hospital is open 9 AM - 5 PM Monday to Friday. Emergency services: 24/7.",
  "contact_info": "Call: 1300 367 348 | Email: info@stgeorge.health",
};

export const FEEDBACK_SENTIMENT = [
  {
    id: "FBK-1001",
    patient_id: "SGH-PT-88213",
    comment: "Excellent service, Dr. Chen was very professional and thorough",
    sentiment: "positive",
    rating: 5
  },
  {
    id: "FBK-1002",
    patient_id: "SGH-PT-90142",
    comment: "Long wait time but doctor was helpful",
    sentiment: "neutral",
    rating: 3
  },
  {
    id: "FBK-1003",
    patient_id: "SGH-PT-77012",
    comment: "Very disappointed with the service",
    sentiment: "negative",
    rating: 2
  },
];

// ============================================================================
// SECURITY & AUDIT
// ============================================================================
export const AUDIT_DETAILS = [
  { 
    user: "a.chen@stgeorge.health", 
    role: "Doctor",
    action: "Viewed patient record", 
    target: "SGH-PT-88213", 
    time: "10:42 AM", 
    outcome: "Success",
    date: "2026-08-15"
  },
  { 
    user: "admin.branch.kog", 
    role: "Administrator",
    action: "Deactivated staff account", 
    target: "USR-4471", 
    time: "09:15 AM", 
    outcome: "Success",
    date: "2026-08-15"
  },
];

// ============================================================================
// IN-PATIENT & WARD MANAGEMENT (Enhancement: FR52-FR54)
// ============================================================================
export const ADMISSIONS = [
  {
    id: "ADM-1001",
    patient_id: "SGH-PT-88213",
    branch_id: "STG-KOG",
    admitted_at: "2026-08-10T14:30:00Z",
    bed_id: "BED-A-101",
    ward: "Cardiology",
    status: "admitted",
    doctor_id: "D-1042"
  },
];

export const BEDS = [
  { id: "BED-A-101", ward: "Cardiology", room: "A-10", branch: "STG-KOG", status: "occupied" },
  { id: "BED-A-102", ward: "Cardiology", room: "A-10", branch: "STG-KOG", status: "available" },
  { id: "BED-B-201", ward: "General Ward", room: "B-20", branch: "STG-KOG", status: "available" },
];
