#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
drawio_commit=$(node --input-type=module -e "import fs from 'node:fs'; console.log(JSON.parse(fs.readFileSync('public/SOURCE-VERSIONS.json')).drawio.commit)")
[[ "$drawio_commit" =~ ^[a-f0-9]{40}$ ]]
vendor_temp=$(mktemp -d)
trap 'rm -rf "$vendor_temp"' EXIT
curl --fail --location --retry 3 "https://codeload.github.com/jgraph/drawio/tar.gz/$drawio_commit" --output "$vendor_temp/drawio.tar.gz"
tar -xzf "$vendor_temp/drawio.tar.gz" -C "$vendor_temp"
mkdir -p public/vendor/drawio
cp -a "$vendor_temp/drawio-$drawio_commit/src/main/webapp/." public/vendor/drawio/
cp "$vendor_temp/drawio-$drawio_commit/LICENSE" public/vendor/drawio/LICENSE
cp "$vendor_temp/drawio-$drawio_commit/README.md" public/vendor/drawio/README.md
rm -rf public/vendor/drawio/WEB-INF public/vendor/drawio/META-INF
find public/vendor/drawio -name '*.map' -delete
node scripts/vendor.mjs
