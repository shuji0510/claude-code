#!/usr/bin/env bash
# Generate an image via OpenAI Images API (GPT Image).
#
# Usage:
#   scripts/gen-image.sh "<prompt>" [output.png] [size]
#
# Defaults:
#   output: ./image-<timestamp>.png
#   size:   1024x1024  (also: 1024x1536, 1536x1024, auto)
#
# Env:
#   OPENAI_API_KEY      required
#   OPENAI_IMAGE_MODEL  optional, default "gpt-image-1"
#                       (set to "gpt-image-2" once your account has access)
#   OPENAI_IMAGE_QUALITY optional: low|medium|high|auto (default: auto)

set -euo pipefail

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
  sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

: "${OPENAI_API_KEY:?OPENAI_API_KEY is required}"

prompt=$1
output=${2:-image-$(date +%Y%m%d-%H%M%S).png}
size=${3:-1024x1024}
model=${OPENAI_IMAGE_MODEL:-gpt-image-1}
quality=${OPENAI_IMAGE_QUALITY:-auto}

payload=$(jq -n \
  --arg m "$model" \
  --arg p "$prompt" \
  --arg s "$size" \
  --arg q "$quality" \
  '{model:$m, prompt:$p, size:$s, quality:$q, n:1}')

response=$(curl -fsSL https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$payload")

b64=$(printf '%s' "$response" | jq -r '.data[0].b64_json // empty')
if [[ -z "$b64" ]]; then
  echo "error: no image in response" >&2
  printf '%s\n' "$response" >&2
  exit 1
fi

printf '%s' "$b64" | base64 -d > "$output"
echo "$output"
