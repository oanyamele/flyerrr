export const useHttpBackend = import.meta.env.VITE_DATA_BACKEND === "http";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export const apiRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    ...init, credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error ?? "Unable to complete this request. Try again.", response.status);
  }
  return response.status === 204 ? undefined as T : response.json();
};
