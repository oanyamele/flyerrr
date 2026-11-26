import { apiBaseUrl, repositoryMode, type RepositoryMode } from "@/repositories/config";
import { bundleRepositories, type AppRepositories } from "@/repositories/contracts";
import { HttpRepository } from "@/repositories/httpRepository";
import { LocalStorageRepository } from "@/repositories/localStorageRepository";

export const createLocalRepositories = (): AppRepositories => bundleRepositories(new LocalStorageRepository());

/** Loads the HTTP adapter. A failed request falls back to localStorage, the offline adapter. */
export const openHttpRepositories = async (
  baseUrl = apiBaseUrl(),
  fetchImpl: typeof fetch = fetch,
): Promise<AppRepositories> => {
  try {
    const http = new HttpRepository(baseUrl, fetchImpl);
    await http.load();
    return bundleRepositories(http);
  } catch {
    return createLocalRepositories();
  }
};

export const openRepositories = (mode: RepositoryMode = repositoryMode()): Promise<AppRepositories> | AppRepositories => {
  if (mode === "local") return createLocalRepositories();
  return openHttpRepositories();
};
