/**
 * CLI tool to provision a new device key pair.
 *
 * Usage:
 *   pnpm --filter api add-device "My Phone"
 *
 * Registers the device in local D1, then prints the credential JSON to paste into the app.
 */

import { webcrypto as crypto } from "node:crypto";
import { execSync } from "node:child_process";

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

const safeNickname = nickname.replace(/'/g, "''");
const safePublicKey = JSON.stringify(publicJwk).replace(/'/g, "''");

const sql = `INSERT INTO devices (id, nickname, public_key_jwk, created_at) VALUES ('${deviceId}', '${safeNickname}', '${safePublicKey}', ${createdAt});`;

function registerLocal(): boolean {
  process.stdout.write("Registering in local D1... ");
  try {
    execSync(`wrangler d1 execute dossier --local --command '${sql.replace(/'/g, "'\\''")}'`, {
      stdio: "pipe",
    });
    console.log("done");
    return true;
  } catch (err) {
    console.log("failed");
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ${msg}`);
    return false;
  }
}

console.log(`\nDevice: ${nickname}`);
console.log(`ID:     ${deviceId}\n`);

const ok = registerLocal();

console.log("\n── Device credential (paste into the app) ───────────────────────");
console.log(JSON.stringify({ deviceId, privateKey: privateJwk }, null, 2));
console.log();

if (!ok) {
  process.exit(1);
}
