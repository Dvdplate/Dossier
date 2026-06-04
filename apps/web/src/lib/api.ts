import { getDeviceCredential, clearDeviceCredential } from "./auth.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Cache the imported CryptoKey to avoid re-importing on every request.
// Keyed by deviceId so a credential change forces a fresh import.
let cachedKey: CryptoKey | null = null;
let cachedKeyDeviceId: string | null = null;

async function getSigningKey(): Promise<CryptoKey | null> {
  const cred = getDeviceCredential();
  if (!cred) return null;

  if (cachedKey && cachedKeyDeviceId === cred.deviceId) return cachedKey;

  cachedKey = await crypto.subtle.importKey(
    "jwk",
    cred.privateKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  cachedKeyDeviceId = cred.deviceId;
  return cachedKey;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function makeAuthHeaders(method: string, path: string): Promise<Record<string, string>> {
  const cred = getDeviceCredential();
  if (!cred) return {};

  const key = await getSigningKey();
  if (!key) return {};

  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${method}\n${path}\n${timestamp}`;
  const sigBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(message),
  );

  return {
    "X-Device-Id": cred.deviceId,
    "X-Timestamp": String(timestamp),
    "X-Signature": toBase64(new Uint8Array(sigBytes)),
  };
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
  const method = (options.method ?? "GET").toUpperCase();

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const authHeaders = await makeAuthHeaders(method, url.pathname + url.search);
  for (const [k, v] of Object.entries(authHeaders)) {
    headers.set(k, v);
  }

  const res = await fetch(url.toString(), { ...options, method, headers });

  if (res.status === 401) {
    clearDeviceCredential();
    cachedKey = null;
    cachedKeyDeviceId = null;
    window.dispatchEvent(new Event("auth-required"));
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let msg = "Network response was not ok";
    try {
      const errorData = await res.json();
      msg = errorData.error?.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    fetchApi<T>(endpoint, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  del: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: "DELETE" }),
};
