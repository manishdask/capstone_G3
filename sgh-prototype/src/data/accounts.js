// Account records used for login/registration.
// Patients self-register through the Register form (FR1). Doctor, Staff and
// Admin accounts are provisioned by an administrator (FR5) — this seed list
// stands in for that provisioning step since there is no backend here.

export const SEED_ACCOUNTS = [
  {
    id: "USR-1001",
    name: "Ravi Shah",
    email: "ravi.shah@patient.stgeorge.health",
    password: "Patient123!",
    role: "patient",
    patientId: "SGH-PT-88213",
    branch: "Kogarah",
  },
  {
    id: "USR-1002",
    name: "Dr. Amelia Chen",
    email: "a.chen@stgeorge.health",
    password: "Doctor123!",
    role: "doctor",
    branch: "Kogarah",
  },
  {
    id: "USR-1003",
    name: "Nadia Farouk",
    email: "n.farouk@stgeorge.health",
    password: "Staff123!",
    role: "staff",
    branch: "Kogarah",
  },
  {
    id: "USR-1004",
    name: "Administrator",
    email: "admin@stgeorge.health",
    password: "Admin123!",
    role: "admin",
    branch: "All branches",
  },
];

// Generates a global patient ID in the same format used across the SRS (FR12).
export function generatePatientId() {
  const n = Math.floor(10000 + Math.random() * 89999);
  return `SGH-PT-${n}`;
}

export function generateUserId() {
  return `USR-${Math.floor(1000 + Math.random() * 8999)}`;
}