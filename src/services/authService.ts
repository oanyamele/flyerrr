import { type AppUser, type UserRole } from "@/data/appDatabase";
import { STORAGE_KEYS, readJson, removeItem, writeJson } from "@/lib/storage";

export type { UserRole };

export interface AuthSession {
  isLoggedIn: boolean;
  role: UserRole;
  userName: string;
  email?: string;
  userId?: string;
}

/** Existing production key — changing it would log everyone out. */
export const AUTH_STORAGE_KEY = STORAGE_KEYS.auth;

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

export const loadSession = (): AuthSession =>
  readJson(AUTH_STORAGE_KEY, loggedOutSession(), isAuthSession);

export const saveSession = (session: AuthSession) => {
  writeJson(AUTH_STORAGE_KEY, session);
};

export const clearSession = () => {
  removeItem(AUTH_STORAGE_KEY);
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
