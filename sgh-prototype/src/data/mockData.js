// All fake/demo data for the prototype lives here.
// Nothing in this file is persisted anywhere — edit freely for your own demo.

export const BRANCHES = [
  { id: "STG-KOG", name: "Kogarah", state: "NSW", patients: 3210, revenue: 482000, beds: 120, occupancy: 78 },
  { id: "STG-HUR", name: "Hurstville", state: "NSW", patients: 1890, revenue: 265000, beds: 80, occupancy: 64 },
  { id: "STG-PAR", name: "Parramatta", state: "NSW", patients: 2410, revenue: 341000, beds: 95, occupancy: 71 },
  { id: "STG-SBK", name: "Southbank", state: "VIC", patients: 1650, revenue: 228000, beds: 70, occupancy: 58 },
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
