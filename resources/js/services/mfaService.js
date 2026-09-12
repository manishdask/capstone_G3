import { apiFetch, setToken } from "./api.js";
import { normalizeUser } from "./adapters.js";

/** FR50: generates a pending TOTP secret for the authenticated user to enrol. */
export async function setupMfa() {
  const res = await apiFetch("/mfa/setup", { method: "POST" });
  return res.data; // { secret, otpauth_url }
}

/** Confirms the pending secret with a real code, activating MFA. Returns recovery codes. */
export async function enableMfa(code) {
  const res = await apiFetch("/mfa/enable", { method: "POST", body: { code } });
  return res.data.recovery_codes;
}

export async function disableMfa(password) {
  await apiFetch("/mfa/disable", { method: "POST", body: { password } });
}

/** Second login step: exchanges a challenge + TOTP/recovery code for a real session. */
export async function verifyMfaLogin({ challenge, code }) {
  const res = await apiFetch("/auth/mfa/verify", { method: "POST", body: { challenge, code } });
  setToken(res.token);
  return normalizeUser(res.data);
}
