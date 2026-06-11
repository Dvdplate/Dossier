import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { buildAuthMessage } from "../src/lib/deviceAuth.js";

const TEST_DEVICE_ID = "00000000-0000-4000-8000-000000000001";
const ORIGIN = "https://localhost";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function seedTestDevice(): Promise<CryptoKey> {
  const keyPair = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const { privateKey, publicKey } = keyPair;

  const publicJwk = await crypto.subtle.exportKey("jwk", publicKey);

  await env.DB.prepare(
    "INSERT INTO devices (id, nickname, public_key_jwk) VALUES (?, ?, ?)",
  )
    .bind(TEST_DEVICE_ID, "test-device", JSON.stringify(publicJwk))
    .run();

  return privateKey;
}

async function signedHeaders(
  privateKey: CryptoKey,
  method: string,
  path: string,
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = buildAuthMessage(method, path, timestamp);
  const sigBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(message),
  );

  return {
    "X-Device-Id": TEST_DEVICE_ID,
    "X-Timestamp": String(timestamp),
    "X-Signature": toBase64(new Uint8Array(sigBytes)),
  };
}

describe("CORS", () => {
  let privateKey: CryptoKey;

  beforeAll(async () => {
    privateKey = await seedTestDevice();
  });

  it("OPTIONS preflight returns CORS headers for Capacitor origin", async () => {
    const res = await SELF.fetch("http://localhost/api/queue", {
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers":
          "Content-Type,X-Device-Id,X-Timestamp,X-Signature",
      },
    });

    expect([200, 204]).toContain(res.status);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("X-Device-Id");
  });

  it("signed GET includes Access-Control-Allow-Origin for allowed origin", async () => {
    const auth = await signedHeaders(privateKey, "GET", "/api/queue");

    const res = await SELF.fetch("http://localhost/api/queue", {
      method: "GET",
      headers: {
        Origin: ORIGIN,
        ...auth,
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
  });
});
