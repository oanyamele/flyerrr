import type { AppUser } from "@/data/appDatabase";
import type { DatabasePort } from "./databasePort";
import type { AuthenticateUserInput, CreateUserInput, UserRepository } from "./contracts";

const nowIso = () => new Date().toISOString();

export const createUserRepository = (db: DatabasePort): UserRepository => ({
  create(input: CreateUserInput) {
    const database = db.read();
    const normalizedEmail = input.email.trim().toLowerCase();
    const exists = database.users.some((user) => user.email.toLowerCase() === normalizedEmail);
    if (exists) return { ok: false as const, error: "Account already exists for this email." };

    const user: AppUser = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      password: input.password,
      name: input.name.trim(),
      role: input.role,
      createdAt: nowIso(),
      lastLoginAt: nowIso(),
      metadata: { notificationsEnabled: true },
    };

    db.save({ ...database, users: [user, ...database.users] });
    return { ok: true as const, user };
  },

  authenticate(input: AuthenticateUserInput) {
    const database = db.read();
    const normalizedEmail = input.email.trim().toLowerCase();
    const match = database.users.find(
      (user) =>
        user.email.toLowerCase() === normalizedEmail &&
        user.password === input.password &&
        user.role === input.role,
    );

    if (!match) return { ok: false as const, error: "Invalid email, password, or role." };

    const loggedInAt = nowIso();
    const nextUsers = database.users.map((user) =>
      user.id === match.id ? { ...user, lastLoginAt: loggedInAt } : user,
    );
    db.save({ ...database, users: nextUsers });
    return { ok: true as const, user: { ...match, lastLoginAt: loggedInAt } };
  },
});
