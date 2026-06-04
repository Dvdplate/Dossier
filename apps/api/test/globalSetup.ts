import { execSync } from "child_process";

export default function setup() {
  try {
    execSync("pnpm exec wrangler d1 migrations apply quest-maker-v3 --local", { stdio: "inherit" });
  } catch (e) {
    console.error("Failed to apply migrations:", e);
  }
}
