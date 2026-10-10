#!/usr/bin/env bash
# Throwaway: packs the Qollab bridge test plus engine.py into dist/qollab-smoke.zip.
set -euo pipefail
cd "$(dirname "$0")/../.."
rm -rf dist/qollab-smoke dist/qollab-smoke.zip
mkdir -p dist/qollab-smoke/quantum
cp scripts/qollab-smoke/index.html scripts/qollab-smoke/main.js dist/qollab-smoke/
cp backend/engine.py dist/qollab-smoke/quantum/engine.py
: > dist/qollab-smoke/quantum/__init__.py
(cd dist/qollab-smoke && zip -qr ../qollab-smoke.zip .)
echo "wrote dist/qollab-smoke.zip"
