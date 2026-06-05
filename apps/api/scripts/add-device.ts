/**
 * CLI tool to generate a new device key pair.
 *
 * Usage:
 *   pnpm --filter api add-device "My Phone"
 *
 * Generates the credential and prints it to the console. It does not touch the
 * database — register the device separately if needed.
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

console.log(`\nDevice: ${nickname}`);
console.log(`ID:     ${deviceId}\n`);

console.log("── Public key (register this device) ────────────────────────────");
console.log(JSON.stringify(publicJwk, null, 2));

console.log("\n── Device credential (paste into the app) ───────────────────────");
console.log(JSON.stringify({ deviceId, privateKey: privateJwk }, null, 2));
console.log();
