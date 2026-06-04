#!/usr/bin/env bash
# Sets up the local D1 database and applies all migrations.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "Applying migrations to local D1..."
pnpm wrangler d1 migrations apply dossier --local
echo "Done."
