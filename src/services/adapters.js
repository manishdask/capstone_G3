// Converts raw Laravel API responses (snake_case, lowercase enum statuses)
// into the shapes the existing presentational components already expect
// (camelCase-ish display fields, Capitalized statuses). Real DB ids are
// preserved under distinct keys (e.g. `_id`, `patientRecordId`, `doctorStaffId`)
// so components can still submit real API calls even though the visible
// `id` is often a human-readable code like a global patient ID.

export function capitalize(value) {
  if (!value) return "";
  return String(value)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

// "14:30:00" -> "2:30 PM"
export function formatTime(value) {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function roleBucket(roleNames = []) {
  if (roleNames.includes("Patient")) return "patient";
  if (roleNames.includes("Doctor")) return "doctor";
  if (roleNames.includes("Admin") || roleNames.includes("Branch Manager")) return "admin";
  if (roleNames.length > 0) return "staff";
  return "patient";
}

export function humanizeStaffType(staffType) {
  return capitalize(staffType || "");
}

export function normalizeUser(raw) {
  if (!raw) return null;
  const roleNames = (raw.roles || []).map((r) => r.name);

  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    username: raw.username,
    branch: raw.branch?.name ?? null,
    branchId: raw.branch_id ?? null,
    roleNames,
    role: roleBucket(roleNames),
    patientId: raw.patient?.global_patient_id ?? null,
    patientRecordId: raw.patient?.id ?? null,
    allergies: raw.patient?.allergies || null,
    contact: raw.patient?.contact_number ?? null,
    dob: raw.patient?.date_of_birth ? formatDate(raw.patient.date_of_birth) : null,
    gender: raw.patient?.gender ? capitalize(raw.patient.gender) : null,
    staffId: raw.staff?.id ?? null,
    staffType: raw.staff?.staff_type ?? null,
    doctorId: raw.staff?.doctor?.id ?? null,
    // FR50: MFA is mandatory for Admin/Branch Manager — derived from role so
    // it self-heals on refresh, rather than relying only on the login response flag.
    requiresMfa: roleNames.includes("Admin") || roleNames.includes("Branch Manager"),
    mfaEnabled: raw.two_factor_enabled_at != null,
  };
}

export function normalizePatient(raw) {
  return {
    id: raw.global_patient_id,
    _id: raw.id,
    name: `${raw.first_name ?? ""} ${raw.last_name ?? ""}`.trim(),
    firstName: raw.first_name,
    lastName: raw.last_name,
    dob: formatDate(raw.date_of_birth),
    gender: capitalize(raw.gender),
    branch: raw.branch?.name ?? "",
    branchId: raw.branch_id,
    contactNumber: raw.contact_number,
    email: raw.email,
    allergies: raw.allergies || "None known",
    status: raw.status,
  };
}

export function normalizeStaff(raw) {
  const isDoctor = raw.staff_type === "doctor";
  return {
    id: raw.id,
    name: raw.user?.name ?? "",
    email: raw.user?.email ?? "",
    branch: raw.branch?.name ?? "",
    branchId: raw.branch_id,
    staffType: raw.staff_type,
    status: raw.status === "active" ? "Active" : "Deactivated",
    role: isDoctor ? `Doctor · ${raw.doctor?.specialization ?? ""}` : humanizeStaffType(raw.staff_type),
    specialty: raw.doctor?.specialization ?? "",
    gender: raw.doctor?.gender ? capitalize(raw.doctor.gender) : "",
    fee: raw.doctor?.consultation_fee ?? null,
    bio: raw.doctor?.bio ?? "",
    rating: raw.feedback_avg_rating ? Number(raw.feedback_avg_rating).toFixed(1) : null,
    reviews: raw.feedback_count ?? 0,
  };
}

export function normalizeAppointment(raw) {
  return {
    id: raw.id,
    patientId: raw.patient?.global_patient_id ?? "",
    patientRecordId: raw.patient_id,
    patientName: raw.patient ? `${raw.patient.first_name} ${raw.patient.last_name}` : "",
    doctor: raw.doctor?.user?.name ?? "",
    doctorStaffId: raw.doctor_staff_id,
    specialty: raw.doctor?.doctor?.specialization ?? "",
    branch: raw.branch?.name ?? "",
    branchId: raw.branch_id,
    date: formatDate(raw.appointment_date),
    rawDate: typeof raw.appointment_date === "string" ? raw.appointment_date.slice(0, 10) : raw.appointment_date,
    time: formatTime(raw.start_time),
    rawStartTime: raw.start_time,
    rawEndTime: raw.end_time,
    status: capitalize(raw.status),
    reason: raw.reason || "",
  };
}

export function normalizeMedicine(raw) {
  let status = "OK";
  if (raw.quantity <= 0) status = "Critical";
  else if (raw.quantity < raw.threshold * 0.5) status = "Critical";
  else if (raw.quantity < raw.threshold) status = "Low";

  return {
    id: raw.id,
    name: raw.name,
    qty: raw.quantity,
    min: raw.threshold,
    status,
    branchId: raw.branch_id,
    expiryDate: raw.expiry_date,
    unitPrice: Number(raw.unit_price),
  };
}

export function normalizePrescription(raw) {
  const firstItem = raw.items?.[0];
  return {
    id: raw.id,
    patientId: raw.patient?.global_patient_id ?? "",
    patientRecordId: raw.patient_id,
    patientName: raw.patient ? `${raw.patient.first_name} ${raw.patient.last_name}` : "",
    doctorName: raw.prescriber?.user?.name ?? "",
    status: capitalize(raw.status),
    date: formatDate(raw.issued_at),
    medicine: firstItem?.medicine?.name ?? "",
    dosage: firstItem?.dosage ?? "",
    items: (raw.items || []).map((it) => ({
      id: it.id,
      medicineId: it.medicine_id,
      medicine: it.medicine?.name ?? "",
      dosage: it.dosage,
      frequency: it.frequency,
    })),
  };
}

export function normalizeLabOrder(raw) {
  const latestResult = raw.results?.[raw.results.length - 1];
  const status = raw.status === "completed" ? "Ready" : raw.status === "cancelled" ? "Cancelled" : "In progress";

  return {
    id: raw.id,
    patientId: raw.patient?.global_patient_id ?? "",
    patientRecordId: raw.patient_id,
    patientName: raw.patient ? `${raw.patient.first_name} ${raw.patient.last_name}` : "",
    test: raw.test_type,
    requestedBy: raw.requester?.user?.name ?? "",
    status,
    date: latestResult?.released_at ? formatDate(latestResult.released_at) : "Pending",
    result: latestResult?.result_details ?? "",
    resultId: latestResult?.id ?? null,
  };
}

export function normalizeInvoice(raw) {
  return {
    id: raw.id,
    patientId: raw.patient?.global_patient_id ?? "",
    patientRecordId: raw.patient_id,
    desc: (raw.items || []).map((i) => i.description).join(", ") || "Hospital charges",
    date: formatDate(raw.issued_at),
    amount: Number(raw.total_amount),
    status: capitalize(raw.status),
    items: raw.items || [],
  };
}

export function normalizeBranch(raw) {
  return {
    id: raw.id,
    name: raw.name,
    state: raw.state,
    address: raw.address,
    patients: raw.patients_count ?? 0,
    staffCount: raw.staff_count ?? 0,
    beds: raw.capacity ?? 0,
    status: raw.status === "active" ? "Active" : "Inactive",
  };
}

export function normalizeFeedback(raw) {
  return {
    id: raw.id,
    patientId: raw.patient?.global_patient_id ?? "Anonymous",
    patientName: raw.patient ? `${raw.patient.first_name} ${raw.patient.last_name}` : "Anonymous",
    branch: raw.branch?.name ?? "—",
    doctor: raw.doctor?.user?.name ?? "General",
    rating: raw.rating,
    comment: raw.comment,
    date: formatDate(raw.created_at),
    time: formatDateTime(raw.created_at),
  };
}

export function normalizeAuditLog(raw) {
  return {
    user: raw.actor?.email ?? "system/guest",
    action: raw.action,
    target: raw.object_type ? `${raw.object_type} #${raw.object_id ?? ""}` : String(raw.object_id ?? "—"),
    time: formatDateTime(raw.created_at),
    outcome: raw.outcome === "success" ? "Success" : "Denied",
  };
}
