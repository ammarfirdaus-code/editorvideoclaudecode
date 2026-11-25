#!/usr/bin/env bash
# Buat folder projek video baru ikut template.
# Guna: bash scripts/projek-baru.sh <id-template> "<Tajuk>"
set -euo pipefail

ID="${1:?guna: projek-baru.sh <id-template> \"<Tajuk>\"}"
TAJUK="${2:?guna: projek-baru.sh <id-template> \"<Tajuk>\"}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TPL="$ROOT/templates/$ID"

if [ ! -f "$TPL/TEMPLATE.md" ]; then
  echo "Template '$ID' tiada. Pilihan:" >&2
  ls "$ROOT/templates" | grep -v '\.md$' >&2
  exit 1
fi

SLUG="$(echo "$TAJUK" | sed 's/[^A-Za-z0-9 ]//g; s/ \+/-/g')"
DIR="$ROOT/projek/$(date +%F)_$SLUG"
if [ -e "$DIR" ]; then echo "Folder dah wujud: $DIR" >&2; exit 1; fi

mkdir -p "$DIR"/{aset,kerja,render}
if [ -n "$(ls -A "$TPL/enjin" 2>/dev/null | grep -v '^.gitkeep$')" ]; then
  cp -r "$TPL/enjin/." "$DIR/kerja/"
  rm -f "$DIR/kerja/.gitkeep"
  ENJIN="disalin ke kerja/"
else
  ENJIN="BELUM ADA dalam repo, lihat bahagian Enjin dalam TEMPLATE.md"
fi

cat > "$DIR/BRIEF.md" <<EOF
# $TAJUK

- Tarikh: $(date +%F)
- Template: $ID (templates/$ID/TEMPLATE.md)
- Enjin: $ENJIN
- Untuk: 
- Platform / nisbah: 
- Tujuan: 
- CTA: 
- Bahan yang ada: 
- Status: draf

## Skrip

## Nota revisi
EOF

echo "Projek dibuat: $DIR"
echo "Enjin: $ENJIN"
