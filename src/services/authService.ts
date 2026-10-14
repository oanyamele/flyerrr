import { type AppUser, type UserRole } from "@/data/appDatabase";

export type { UserRole };

export interface AuthSession {
  isLoggedIn: boolean;
  role: UserRole;
  userName: string;
  email?: string;
  userId?: string;
}

/** Existing production key — changing it would log everyone out. */
export const AUTH_STORAGE_KEY = "flyerrr_auth";

export const loggedOutSession = (): AuthSession => ({
  isLoggedIn: false,
  role: "student",
  userName: "",
});

const isUserRole = (value: unknown): value is UserRole =>
  value === "student" || value === "org_officer";

export const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.isLoggedIn === "boolean" &&
    isUserRole(session.role) &&
    typeof session.userName === "string"
  );
};

export const loadSession = (): AuthSession => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return loggedOutSession();

  try {
    const parsed: unknown = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : loggedOutSession();
  } catch {
    return loggedOutSession();
  }
};

export const saveSession = (session: AuthSession) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const sessionFromUser = (user: AppUser): AuthSession => ({
  isLoggedIn: true,
  role: user.role,
  userName: user.name,
  email: user.email,
  userId: user.id,
});

export const createLoggedInSession = (
  role: UserRole,
  name: string,
  options?: { email?: string; userId?: string },
): AuthSession => ({
  isLoggedIn: true,
  role,
  userName: name,
  email: options?.email,
  userId: options?.userId,
});
