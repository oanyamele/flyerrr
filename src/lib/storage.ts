/**
 * The single boundary between the app and browser storage.
 *
 * Every key follows one convention: `flyerrr_<name>_v<schema version>`. Bump the
 * version when a value's shape changes incompatibly, and add the old key to
 * LEGACY_KEYS so saved data is carried over instead of lost.
 */
export const STORAGE_KEYS = {
  auth: "flyerrr_auth_v1",
  follows: "flyerrr_follows_v1",
  theme: "flyerrr_theme_v1",
  database: "flyerrr_db_v1",
  rsvps: "flyerrr_rsvps_v1",
  reminders: "flyerrr_reminders_v1",
  checkInTokens: "flyerrr_checkin_tokens_v1",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Names used before issue #28 unified them. The stored values have the same shape,
 * so migration copies them unchanged.
 */
export const LEGACY_KEYS: Record<StorageKey, string> = {
  [STORAGE_KEYS.auth]: "flyerrr_auth",
  [STORAGE_KEYS.follows]: "flyerrr_follows",
  [STORAGE_KEYS.theme]: "flyerrr_theme",
  [STORAGE_KEYS.database]: "flyer_db_v1",
  [STORAGE_KEYS.rsvps]: "flyer_rsvp_v1",
  [STORAGE_KEYS.reminders]: "flyer_reminders_v1",
  [STORAGE_KEYS.checkInTokens]: "flyer_checkin_tokens_v1",
};

/**
 * Moves data saved under legacy key names to the current ones. Call once before
 * the app renders. Safe to run repeatedly. An old key is removed only after its
 * value is safely under the new name. If a new value already exists it wins,
 * because it was written more recently. Never throws: if storage is blocked or
 * full, the old data is left where it is and the app starts as it would anyway.
 */
export const migrateLegacyKeys = (): void => {
  for (const [currentKey, legacyKey] of Object.entries(LEGACY_KEYS)) {
    try {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue === null) continue;
      if (localStorage.getItem(currentKey) === null) {
        localStorage.setItem(currentKey, legacyValue);
      }
      localStorage.removeItem(legacyKey);
    } catch {
      // Leave this key alone and keep migrating the others.
    }
  }
};

/** Returns the raw saved value, or null when it is missing or storage is blocked. */
export const readString = (key: StorageKey): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Returns the parsed saved value, or `fallback` when it is missing, corrupt, or
 * rejected by `isValid`. Pass `isValid` whenever bad data could break the caller.
 */
export const readJson = <T>(
  key: StorageKey,
  fallback: T,
  isValid?: (value: unknown) => value is T,
): T => {
  const raw = readString(key);
  if (!raw) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValid) return isValid(parsed) ? parsed : fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
};

// Writes throw when storage is full or blocked, so callers can tell the user that
// nothing was saved. EventDetail relies on this to show its QR error message.
export const writeString = (key: StorageKey, value: string): void => {
  localStorage.setItem(key, value);
};

export const writeJson = (key: StorageKey, value: unknown): void => {
  writeString(key, JSON.stringify(value));
};

export const removeItem = (key: StorageKey): void => {
  localStorage.removeItem(key);
};
