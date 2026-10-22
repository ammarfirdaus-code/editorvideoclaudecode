#!/usr/bin/env bash
# Copies GSAP into a HyperFrames project so renders don't depend on a CDN.
# Usage: bash scripts/vendor-gsap.sh path/to/project
set -euo pipefail

PROJECT="${1:?usage: vendor-gsap.sh <project-dir>}"
GSAP_VERSION="3.14.2"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

npm install --prefix "$WORK" --silent "gsap@$GSAP_VERSION"
mkdir -p "$PROJECT/vendor"
cp "$WORK/node_modules/gsap/dist/gsap.min.js" "$PROJECT/vendor/gsap.min.js"

echo "Copied gsap@$GSAP_VERSION to $PROJECT/vendor/gsap.min.js"
echo 'Use in index.html: <script src="vendor/gsap.min.js"></script>'
