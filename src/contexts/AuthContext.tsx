import { createContext, useContext, useState, ReactNode } from "react";
import { type AppUser } from "@/data/appDatabase";

export type UserRole = "student" | "org_officer";

interface AuthState {
  isLoggedIn: boolean;
  role: UserRole;
  userName: string;
  email?: string;
  userId?: string;
}

interface AuthContextType {
  auth: AuthState;
  login: (role: UserRole, name: string, options?: { email?: string; userId?: string }) => void;
  loginWithUser: (user: AppUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem("flyerrr_auth");
    return saved ? JSON.parse(saved) : { isLoggedIn: false, role: "student", userName: "" };
  });

  const login = (role: UserRole, name: string, options?: { email?: string; userId?: string }) => {
    const state = { isLoggedIn: true, role, userName: name, email: options?.email, userId: options?.userId };
    setAuth(state);
    localStorage.setItem("flyerrr_auth", JSON.stringify(state));
  };

  const loginWithUser = (user: AppUser) => {
    login(user.role, user.name, { email: user.email, userId: user.id });
  };

  const logout = () => {
    setAuth({ isLoggedIn: false, role: "student", userName: "" });
    localStorage.removeItem("flyerrr_auth");
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
