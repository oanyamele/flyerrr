import type { AppDatabase } from "@/data/appDatabase";

/**
 * Persistence port used by repositories.
 * The localStorage and in-memory adapters both satisfy this contract,
 * so use-case code does not choose a storage engine.
 */
export interface DatabasePort {
  read(): AppDatabase;
  save(db: AppDatabase): AppDatabase;
}
