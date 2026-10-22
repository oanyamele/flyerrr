import type { AppRepositories } from "./contracts";
import type { DatabasePort } from "./databasePort";
import { createEventRepository } from "./eventRepository";
import { createLocalStorageDatabase } from "./localStorageDatabase";
import { createUserRepository } from "./userRepository";

/** Composition root. Production uses localStorage; tests pass another DatabasePort. */
export const createAppRepositories = (port: DatabasePort = createLocalStorageDatabase()): AppRepositories => ({
  users: createUserRepository(port),
  events: createEventRepository(port),
});
