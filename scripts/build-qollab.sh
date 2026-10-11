#!/usr/bin/env bash
# Builds the Qollab project into dist/qollab/ and dist/qollab.zip: the lesson player bundled into
# main.js/main.css, plus engine.py as the Python module it calls. Upload the zip on qollab.xyz.
# RELEASE=1 refuses to build while README.md (the public project page) still has TODO(team) lines.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=dist/qollab

if grep -q 'TODO(team)' README.md; then
  [ "${RELEASE:-0}" = 1 ] && { echo "FAIL: README.md still has TODO(team) lines; it becomes the Qollab project page" >&2; exit 1; }
  echo "WARNING: README.md still has TODO(team) lines; fill them before RELEASE=1" >&2
fi

rm -rf "$OUT" dist/qollab.zip
mkdir -p "$OUT/quantum"
npx esbuild src/qollab/main.tsx --bundle --format=esm --jsx=automatic --minify \
  --external:quantum.engine --define:process.env.NODE_ENV='"production"' \
  --outfile="$OUT/main.js" --log-level=error
npx tailwindcss -i src/qollab/qollab.css -o "$OUT/main.css" --minify
cp src/qollab/index.html src/qollab/requirements.txt README.md LICENSE "$OUT/"
cp backend/engine.py "$OUT/quantum/engine.py"
mkdir -p "$OUT/docs/images" && cp docs/images/judge-start.png "$OUT/docs/images/"  # the README's screenshot
: > "$OUT/quantum/__init__.py"

COUNT=$(find "$OUT" -type f | wc -l | tr -d ' ')
[ "$COUNT" -le 100 ] || { echo "FAIL: $COUNT files (Qollab allows 100)" >&2; exit 1; }
BIG=$(find "$OUT" -type f -size +2097152c)
[ -z "$BIG" ] || { echo "FAIL: files over 2 MB: $BIG" >&2; exit 1; }
(cd "$OUT" && zip -qr ../qollab.zip .)
echo "wrote dist/qollab.zip ($COUNT files)"
ls -l "$OUT" "$OUT/quantum"
