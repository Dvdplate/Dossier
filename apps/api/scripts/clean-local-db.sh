#!/usr/bin/env bash
# Wipes local D1 state and reapplies migrations from scratch.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "Removing local D1 state..."
rm -rf .wrangler/state/v3/d1

echo "Applying migrations to local D1..."
pnpm wrangler d1 migrations apply dossier-main-db --local

echo "Done. Local D1 is reset."
