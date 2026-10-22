import { createDefaultDatabase, type AppDatabase } from "@/data/appDatabase";
import type { DatabasePort } from "./databasePort";

const stamp = (db: AppDatabase): AppDatabase => ({
  ...db,
  metadata: {
    ...db.metadata,
    lastUpdatedAt: new Date().toISOString(),
  },
});

/** Storage adapter with no browser side effects. Used to prove the repository seam is swappable. */
export const createInMemoryDatabase = (initial?: AppDatabase): DatabasePort => {
  let current = structuredClone(initial ?? createDefaultDatabase());

  return {
    read: () => structuredClone(current),
    save: (db) => {
      current = stamp(db);
      return structuredClone(current);
    },
  };
};
