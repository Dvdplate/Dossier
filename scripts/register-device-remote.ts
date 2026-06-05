/**
 * Generate a device credential and insert it into remote prod D1.
 *
 * Usage:
 *   pnpm register-device:remote M5-Mac
 */

import { spawnSync } from "node:child_process";
import { webcrypto as crypto } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const nickname = process.argv[2]?.trim();
if (!nickname) {
  console.log("\nUsage: pnpm register-device:remote M5-Mac\n");
  process.exit(1);
}

function sqlEscape(s: string) {
  return s.replace(/'/g, "''");
}

function sortJson(value: Record<string, unknown>) {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) sorted[key] = value[key];
  return JSON.stringify(sorted);
}

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);

const privateJwk = await crypto.subtle.exportKey("jwk", privateKey);
const publicJwk = await crypto.subtle.exportKey("jwk", publicKey);
const deviceId = crypto.randomUUID();
const publicKeyJwk = sortJson(publicJwk as Record<string, unknown>);

const sql = `INSERT INTO devices (id, nickname, public_key_jwk) VALUES ('${sqlEscape(deviceId)}', '${sqlEscape(nickname)}', '${sqlEscape(publicKeyJwk)}');`;

const tmpDir = mkdtempSync(join(tmpdir(), "dossier-device-"));
const sqlFile = join(tmpDir, "insert.sql");
writeFileSync(sqlFile, sql);

const apiDir = join(dirname(fileURLToPath(import.meta.url)), "../apps/api");
const result = spawnSync(
  "wrangler",
  ["d1", "execute", "dossier-main-db", "--remote", `--file=${sqlFile}`],
  { cwd: apiDir, stdio: "inherit" },
);

rmSync(tmpDir, { recursive: true, force: true });

if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`\nDevice: ${nickname}`);
console.log(`ID:     ${deviceId}\n`);
console.log("── Device credential (paste into the app) ───────────────────────");
console.log(JSON.stringify({ deviceId, nickname, privateKey: privateJwk }, null, 2));
console.log();
