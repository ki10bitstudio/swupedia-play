#!/usr/bin/env bash
# Fails when "karabast" appears anywhere in the shipped site (src/ and public/).
#
# The Karabast team's condition for this fork is that the play site carries no mention of
# Karabast and does not reuse their homepage, so nobody takes it for their site. This check
# runs in CI (.github/workflows/no-karabast.yml) so an upstream rebase cannot bring a mention
# back unnoticed. It is expected to fail until the removals are done; the count is the work left.
set -euo pipefail
cd "$(dirname "$0")/.."

matches=$(grep -rni --exclude-dir=node_modules karabast src public || true)

# Accepted exception: the card-image host in the S3 URL builder. The unit that moves card images
# to swupedia's own host removes this line, and with it the exception.
matches=$(printf '%s\n' "$matches" | grep -vE "^src/app/_utils/s3Utils\.ts:[0-9]+:[[:space:]]*const s3Bucket = 'https://karabast-data\.s3\.amazonaws\.com/';$" || true)
if [[ -z "$matches" ]]; then
    echo "no mention of karabast in src/ or public/ (besides the accepted card-image host)"
    exit 0
fi

count=$(printf '%s\n' "$matches" | wc -l | tr -d ' ')
files=$(printf '%s\n' "$matches" | cut -d: -f1 | sort -u | wc -l | tr -d ' ')
echo "$count mention(s) of karabast in $files file(s) under src/ and public/:"
printf '%s\n' "$matches"
exit 1
