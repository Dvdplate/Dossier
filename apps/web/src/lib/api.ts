import { getToken, clearToken } from "./auth.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("auth-required"));
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let msg = "Network response was not ok";
    try {
      const errorData = await res.json();
      msg = errorData.error?.message || msg;
    } catch {
      // Ignore
    }
    throw new Error(msg);
  }

  // Handle 204 or empty responses
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) => fetchApi<T>(endpoint, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(endpoint: string, data: unknown) => fetchApi<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  del: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: "DELETE" }),
};
