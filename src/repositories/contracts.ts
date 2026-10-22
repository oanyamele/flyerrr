import type { AppUser, EventRecord, UserRole } from "@/data/appDatabase";
import type { EventCategory } from "@/data/mockEvents";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export type CreateUserResult =
  | { ok: true; user: AppUser }
  | { ok: false; error: string };

export interface AuthenticateUserInput {
  email: string;
  password: string;
  role: UserRole;
}

export type AuthenticateUserResult =
  | { ok: true; user: AppUser }
  | { ok: false; error: string };

export interface CreateEventInput {
  title: string;
  description: string;
  image: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  capacity: number;
  tags: string[];
  creatorName: string;
  creatorRole: UserRole;
  creatorUserId?: string;
}

/** Identity use cases. Pages depend on this contract, not on browser storage. */
export interface UserRepository {
  create(input: CreateUserInput): CreateUserResult;
  authenticate(input: AuthenticateUserInput): AuthenticateUserResult;
}

/** Event catalog use cases. */
export interface EventRepository {
  list(): EventRecord[];
  create(input: CreateEventInput): EventRecord;
}

export interface AppRepositories {
  users: UserRepository;
  events: EventRepository;
}
