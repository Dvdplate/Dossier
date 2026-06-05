/**
 * CLI tool to generate a new device key pair.
 *
 * Usage:
 *   pnpm --filter api add-device M5-Mac
 *
 * Generates the credential and prints it to the console.
 */

import { webcrypto as crypto } from "node:crypto";

const nickname = process.argv[2]?.trim();
if (!nickname) {
  console.log("\nProvide a device nickname, e.g.:\n");
  console.log("  pnpm add-device M5-Mac\n");
  process.exit(0);
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
console.log(JSON.stringify({ deviceId, nickname, privateKey: privateJwk }, null, 2));
console.log();
