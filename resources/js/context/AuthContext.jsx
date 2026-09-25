import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService.js";
import * as mfaService from "../services/mfaService.js";
import { getToken, setToken } from "../services/api.js";

const AuthContext = createContext(null);
const USER_KEY = "sgh_user";

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [booting, setBooting] = useState(() => (getToken() ? !getStoredUser() : false));
  const [sessionNotice, setSessionNotice] = useState("");
  // FR50: set while a login is waiting on a second TOTP/recovery-code step —
  // no user/session exists yet, so this can't just live on `user`.
  const [mfaChallenge, setMfaChallenge] = useState(null);

  // Restore / validate session from a persisted token on first load (page refresh).
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!getToken()) {
        persistUser(null);
        setBooting(false);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) {
          setUser(me);
          persistUser(me);
        }
      } catch (err) {
        // Only a 401 means the session is gone (expired, idle-timed-out or
        // revoked). A timeout or 5xx says nothing about the token, so keep the
        // cached user rather than signing a valid session out on refresh; the
        // next API call will surface a real 401 if there is one.
        const sessionGone = err?.status === 401 || !getStoredUser();
        if (sessionGone) {
          setToken(null);
          persistUser(null);
          if (!cancelled) setUser(null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // NFR11 idle timeout / any 401: the backend already revoked the token.
  useEffect(() => {
    function handleUnauthorized() {
      persistUser(null);
      setUser(null);
      setSessionNotice("Your session has expired due to inactivity. Please sign in again.");
    }
    window.addEventListener("sgh:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("sgh:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    if (result.mfaRequired) {
      setMfaChallenge(result.challenge);
      return result;
    }
    setSessionNotice("");
    setMfaChallenge(null);
    persistUser(result.user);
    setUser(result.user);
    return result;
  }, []);

  const verifyMfaCode = useCallback(async (code) => {
    const me = await mfaService.verifyMfaLogin({ challenge: mfaChallenge, code });
    setSessionNotice("");
    setMfaChallenge(null);
    persistUser(me);
    setUser(me);
    return me;
  }, [mfaChallenge]);

  const cancelMfaChallenge = useCallback(() => setMfaChallenge(null), []);

  const register = useCallback(async (payload) => {
    const me = await authService.register(payload);
    setSessionNotice("");
    persistUser(me);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Token may already be invalid server-side — clear local state regardless.
    }
    persistUser(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await authService.me();
    persistUser(me);
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, booting, sessionNotice, setSessionNotice, login, register, logout, refresh,
        mfaChallenge, verifyMfaCode, cancelMfaChallenge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
