/**
 * The single boundary between the app and browser storage.
 *
 * Key values are deliberately unchanged from what is already saved in users'
 * browsers: renaming one without a migration would log people out or lose their
 * data. Unifying the names is tracked separately in issue #28.
 */
export const STORAGE_KEYS = {
  auth: "flyerrr_auth",
  follows: "flyerrr_follows",
  theme: "flyerrr_theme",
  database: "flyer_db_v1",
  rsvps: "flyer_rsvp_v1",
  reminders: "flyer_reminders_v1",
  checkInTokens: "flyer_checkin_tokens_v1",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

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
