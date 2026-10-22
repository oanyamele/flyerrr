import { getDatabase, saveDatabase } from "@/data/appDatabase";
import type { DatabasePort } from "./databasePort";

export const createLocalStorageDatabase = (): DatabasePort => ({
  read: () => getDatabase(),
  save: (db) => saveDatabase(db),
});
