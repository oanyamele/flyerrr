export type RepositoryMode = "local" | "http";

/** `VITE_REPOSITORY=http` selects the API adapter. Anything else stays on localStorage. */
export const repositoryMode = (
  value: string | undefined = import.meta.env.VITE_REPOSITORY,
): RepositoryMode => (value === "http" ? "http" : "local");

export const apiBaseUrl = (
  value: string | undefined = import.meta.env.VITE_API_BASE_URL,
): string => (value && value.trim() ? value.replace(/\/$/, "") : "/api");
