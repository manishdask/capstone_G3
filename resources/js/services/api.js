// Base HTTP client for the Laravel backend. Every service module in this
// folder wraps this — never call fetch() directly from a component.

const API_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "sgh_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, errors, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors || null;
    this.payload = payload || null;
  }
}

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * @param {string} path - e.g. "/auth/login" (leading slash, no /api prefix)
 * @param {object} options - { method, body, isFormData, signal, timeoutMs }
 */
export async function apiFetch(path, options = {}) {
  const { method = "GET", body, isFormData = false, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const token = getToken();

  const headers = { Accept: "application/json" };
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  // Without this, a request the browser silently drops (rather than actively
  // refuses) leaves fetch() pending forever — no error, no timeout, just a
  // permanent "loading" state with nothing to show the user.
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  if (signal) signal.addEventListener("abort", () => timeoutController.abort());

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal: timeoutController.signal,
    });
  } catch (networkError) {
    if (networkError.name === "AbortError") {
      throw new ApiError(
        `Timed out waiting for a response. Something between your browser and ${API_URL} is blocking or dropping the connection — check firewall/antivirus "web protection" settings and browser extensions.`,
        0
      );
    }
    throw new ApiError(
      "Could not reach the server. Check your connection and that the backend is running.",
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 204) return null;

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 401) {
      setToken(null);
      window.dispatchEvent(new CustomEvent("sgh:unauthorized"));
    }
    throw new ApiError(
      payload?.message || `Request failed (${response.status}).`,
      response.status,
      payload?.errors || null,
      payload
    );
  }

  return payload;
}

// Builds a query string from a plain object, skipping empty values.
export function toQuery(params = {}) {
  const usable = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (usable.length === 0) return "";
  return "?" + new URLSearchParams(usable).toString();
}

/**
 * Triggers a browser file download for an authenticated binary response
 * (PDF/CSV exports) — fetch() doesn't let <a href> attach an Authorization header.
 */
export async function apiDownload(path, filenameFallback = "download") {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
  } catch (networkError) {
    throw new ApiError(
      networkError.name === "AbortError"
        ? "Timed out waiting for the download to start."
        : "Could not reach the server to download the file.",
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ApiError(`Download failed (${response.status}).`, response.status);
  }

  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : filenameFallback;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
