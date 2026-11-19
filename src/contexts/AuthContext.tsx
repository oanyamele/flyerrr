import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest, useHttpBackend } from "@/services/httpApi";
import { type AppUser } from "@/data/appDatabase";
import {
  clearSession,
  createLoggedInSession,
  loadSession,
  loggedOutSession,
  saveSession,
  sessionFromUser,
  type AuthSession,
  type UserRole,
} from "@/services/authService";

export type { UserRole };
export type AuthState = AuthSession;

interface AuthContextType {
  auth: AuthState;
  login: (role: UserRole, name: string, options?: { email?: string; userId?: string }) => void;
  loginWithUser: (user: AppUser) => void;
  loginWithSession: (session: AuthSession) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => useHttpBackend ? loggedOutSession() : loadSession());
  const [loading, setLoading] = useState(useHttpBackend);
  const [failed, setFailed] = useState(false);
  const client = useQueryClient();

  const restoreSession = async () => {
    setLoading(true);
    setFailed(false);
    try { setAuth(await apiRequest<AuthSession>("/auth/session")); }
    catch { setFailed(true); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (useHttpBackend) void restoreSession();
  }, []);

  const loginWithSession = (state: AuthSession) => {
    client.removeQueries({ queryKey: ["events"] });
    client.removeQueries({ queryKey: ["bookmarks"] });
    setAuth(state);
    if (!useHttpBackend) saveSession(state);
  };

  const login = (role: UserRole, name: string, options?: { email?: string; userId?: string }) => {
    if (useHttpBackend) throw new Error("Use the server sign-in flow.");
    const state = createLoggedInSession(role, name, options);
    setAuth(state);
    saveSession(state);
  };

  const loginWithUser = (user: AppUser) => {
    if (useHttpBackend) throw new Error("Use the server sign-in flow.");
    const state = sessionFromUser(user);
    setAuth(state);
    saveSession(state);
  };

  const logout = async () => {
    if (useHttpBackend) await apiRequest("/auth/logout", { method: "POST" });
    setAuth(loggedOutSession());
    clearSession();
    client.removeQueries({ queryKey: ["events"] });
    client.removeQueries({ queryKey: ["bookmarks"] });
  };

  if (loading) return <p role="status" className="p-8 text-center">Signing you in…</p>;
  if (failed) return <div role="alert" className="p-8 text-center"><p>We couldn't connect. Please try again.</p><button type="button" className="mt-4 underline" onClick={() => void restoreSession()}>Retry</button></div>;

  return (
    <AuthContext.Provider value={{ auth, login, loginWithUser, loginWithSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
