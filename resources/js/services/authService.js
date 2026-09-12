import { apiFetch, setToken } from "./api.js";
import { normalizeUser } from "./adapters.js";

/**
 * FR1: patient self-registration form (SRS 4.1.3).
 * Backend expects: first_name, last_name, email, password, password_confirmation,
 * date_of_birth, gender (male|female|other), contact_number, allergies?, branch_id.
 */
export async function register(payload) {
  const res = await apiFetch("/auth/register", { method: "POST", body: payload });
  setToken(res.token);
  return normalizeUser(res.data);
}

/**
 * FR2: `login` accepts either email or username.
 * FR50: Admin/Branch Manager accounts with MFA already enabled get a
 * challenge instead of a token — no session exists until /auth/mfa/verify.
 */
export async function login({ login, password }) {
  const res = await apiFetch("/auth/login", { method: "POST", body: { login, password } });
  if (res.mfa_required) {
    return { mfaRequired: true, challenge: res.challenge };
  }
  setToken(res.token);
  return { mfaRequired: false, user: normalizeUser(res.data) };
}

export async function logout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    setToken(null);
  }
}

export async function me() {
  const res = await apiFetch("/auth/me");
  return normalizeUser(res.data);
}
