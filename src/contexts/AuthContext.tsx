import { createContext, useContext, useState, ReactNode } from "react";
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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => loadSession());

  const login = (role: UserRole, name: string, options?: { email?: string; userId?: string }) => {
    const state = createLoggedInSession(role, name, options);
    setAuth(state);
    saveSession(state);
  };

  const loginWithUser = (user: AppUser) => {
    const state = sessionFromUser(user);
    setAuth(state);
    saveSession(state);
  };

  const logout = () => {
    setAuth(loggedOutSession());
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ auth, login, loginWithUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
