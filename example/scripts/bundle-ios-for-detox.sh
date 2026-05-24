#!/usr/bin/env bash
# Embeds main.jsbundle into the iOS app for Detox / CI (no Metro).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_PATH="${1:-$ROOT/ios/build/Build/Products/Release-iphonesimulator/DrumPickerExample.app}"
if [ ! -d "$APP_PATH" ]; then
  echo "App not found: $APP_PATH" >&2
  exit 1
fi

PRODUCTS_DIR="$(dirname "$APP_PATH")"
PACKAGER_BUNDLE="$PRODUCTS_DIR/DetoxPackagerOutput.jsbundle"

# Library must be built so Metro can resolve the workspace package.
if [ -f "$ROOT/../package.json" ]; then
  (cd "$ROOT/.." && yarn build)
fi

echo "Bundling JS for Detox → $APP_PATH"
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output "$PACKAGER_BUNDLE" \
  --assets-dest "$APP_PATH"

HERMESC="$ROOT/ios/Pods/hermes-engine/destroot/bin/hermesc"
OUTPUT="$APP_PATH/main.jsbundle"

if [ -x "$HERMESC" ]; then
  echo "Compiling Hermes bytecode…"
  "$HERMESC" -emit-binary -max-diagnostic-width=80 -O -out "$OUTPUT" "$PACKAGER_BUNDLE"
  rm -f "$PACKAGER_BUNDLE"
else
  echo "hermesc not found, using packager output as main.jsbundle"
  mv "$PACKAGER_BUNDLE" "$OUTPUT"
fi

if [ ! -f "$OUTPUT" ]; then
  echo "main.jsbundle was not created at $OUTPUT" >&2
  exit 1
fi

echo "main.jsbundle OK ($(wc -c < "$OUTPUT" | tr -d ' ') bytes)"
