#!/usr/bin/env bash
set -euo pipefail

echo "⚡ Running SchemaVault CI validation pipeline..."
node dist/bin.js --version
echo "✔ SchemaVault executable verified."
