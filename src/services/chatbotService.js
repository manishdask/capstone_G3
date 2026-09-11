import { apiFetch } from "./api.js";

/**
 * FR46: non-clinical AI chatbot backed by the OpenRouter gateway.
 * The backend (AiService) classifies clinical/emergency input BEFORE any
 * external call, so only neutral supported questions reach the model — this
 * service is a thin authenticated wrapper around POST /ai/chat.
 */

/**
 * The OpenRouter free model can take 20-60s to answer, but apiFetch defaults to
 * a 10s timeout — so chat calls pass an explicit ~90s timeout (matching the
 * backend's 60s Http timeout with headroom for transit).
 */
const CHAT_TIMEOUT_MS = 90000;

/** Sends one chat message, returns { text, escalate, provider, model }. */
export async function sendChatMessage(message, { model } = {}) {
  const res = await apiFetch("/ai/chat", {
    method: "POST",
    body: { message, model: model || undefined },
    timeoutMs: CHAT_TIMEOUT_MS,
  });
  return res.data;
}