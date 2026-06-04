/**
 * CLI tool to provision a new device key pair.
 *
 * Usage:
 *   pnpm --filter api add-device "My Phone"
 *
 * Outputs:
 *   1. The wrangler command to register the device in D1
 *   2. The device credential JSON to paste into the app
 */

import { webcrypto as crypto } from "node:crypto";

const nickname = process.argv[2]?.trim();
if (!nickname) {
  console.error("Usage: add-device <nickname>");
  process.exit(1);
}

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);

const privateJwk = await crypto.subtle.exportKey("jwk", privateKey);
const publicJwk = await crypto.subtle.exportKey("jwk", publicKey);

const deviceId = crypto.randomUUID();
const createdAt = Math.floor(Date.now() / 1000);

// Escape single quotes for SQL string literals
const safeNickname = nickname.replace(/'/g, "''");
const safePublicKey = JSON.stringify(publicJwk).replace(/'/g, "''");

const sql = `INSERT INTO devices (id, nickname, public_key_jwk, created_at) VALUES ('${deviceId}', '${safeNickname}', '${safePublicKey}', ${createdAt});`;

// Escape double quotes so the SQL is safe inside a double-quoted shell argument
const shellSql = sql.replace(/"/g, '\\"');

console.log(`\nDevice: ${nickname}`);
console.log(`ID:     ${deviceId}\n`);

console.log("── Register (local D1) ──────────────────────────────────────────");
console.log(`wrangler d1 execute dossier --local --command "${shellSql}"\n`);

console.log("── Register (remote D1 / production) ────────────────────────────");
console.log(`wrangler d1 execute dossier --remote --command "${shellSql}"\n`);

console.log("── Device credential (paste into the app) ───────────────────────");
console.log(JSON.stringify({ deviceId, privateKey: privateJwk }, null, 2));
console.log();
