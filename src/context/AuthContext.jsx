import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService.js";
import * as mfaService from "../services/mfaService.js";
import { getToken, setToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [sessionNotice, setSessionNotice] = useState("");
  // FR50: set while a login is waiting on a second TOTP/recovery-code step —
  // no user/session exists yet, so this can't just live on `user`.
  const [mfaChallenge, setMfaChallenge] = useState(null);

  // Restore session from a persisted token on first load (page refresh).
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!getToken()) {
        setBooting(false);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
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
    setUser(result.user);
    return result;
  }, []);

  const verifyMfaCode = useCallback(async (code) => {
    const me = await mfaService.verifyMfaLogin({ challenge: mfaChallenge, code });
    setSessionNotice("");
    setMfaChallenge(null);
    setUser(me);
    return me;
  }, [mfaChallenge]);

  const cancelMfaChallenge = useCallback(() => setMfaChallenge(null), []);

  const register = useCallback(async (payload) => {
    const me = await authService.register(payload);
    setSessionNotice("");
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Token may already be invalid server-side — clear local state regardless.
    }
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await authService.me();
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
