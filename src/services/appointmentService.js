import { apiFetch, toQuery, ApiError } from "./api.js";
import { normalizeAppointment } from "./adapters.js";

export async function listAppointments(params = {}) {
  const res = await apiFetch(`/appointments${toQuery({ per_page: 50, ...params })}`);
  return res.data.map(normalizeAppointment);
}

export async function getDoctorAvailability(doctorStaffId, date) {
  const res = await apiFetch(`/doctors/${doctorStaffId}/availability${toQuery({ date })}`);
  return res.data; // { schedules: [{start_time,end_time}], booked_slots: [{start_time,end_time}] }
}

/**
 * FR16/FR19: books an appointment; the backend rejects overlapping slots
 * transactionally (409) and returns alternative time suggestions.
 * NOTE — FR18 deviation: bookings are confirmed instantly when the slot is
 * free (no manual receptionist approval gate).
 */
export async function bookAppointment({ branchId, specialization, doctorStaffId, date, startTime, endTime, reason }) {
  try {
    const res = await apiFetch("/appointments", {
      method: "POST",
      body: {
        branch_id: branchId,
        specialization,
        doctor_staff_id: doctorStaffId,
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        reason,
      },
    });
    return { appointment: normalizeAppointment(res.data), alternatives: null };
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { appointment: null, alternatives: err.payload?.alternatives ?? [], message: err.message };
    }
    throw err;
  }
}

/** FR18: receptionist/doctor/admin confirms, rejects or cancels. */
export async function updateAppointmentStatus(id, status, reason) {
  const res = await apiFetch(`/appointments/${id}/status`, {
    method: "PATCH",
    body: { status, reason },
  });
  return normalizeAppointment(res.data);
}
