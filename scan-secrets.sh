#!/usr/bin/env bash
# Vercel OAuth Incident (Context.ai) - local code scan
# IOC OAuth app ID: 110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj

set -u

TARGET_DIR="${1:-.}"
IOC_APP_ID="110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj"

RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; BLU=$'\033[34m'; RST=$'\033[0m'
hits=0

section() { printf "\n%s== %s ==%s\n" "$BLU" "$1" "$RST"; }
hit()     { printf "%s[HIT]%s %s\n" "$RED" "$RST" "$1"; hits=$((hits+1)); }
ok()      { printf "%s[OK]%s %s\n"  "$GRN" "$RST" "$1"; }
warn()    { printf "%s[WARN]%s %s\n" "$YEL" "$RST" "$1"; }

command -v rg >/dev/null 2>&1 || { echo "ripgrep (rg) required"; exit 2; }

section "1. IOC OAuth app ID references"
if rg -n --hidden -g '!.git' -g '!scan-secrets.sh' -g '!CHECKLIST.md' -F "$IOC_APP_ID" "$TARGET_DIR" 2>/dev/null; then
  hit "IOC OAuth app ID found in working tree"
else
  ok "IOC OAuth app ID not present in working tree"
fi
if git -C "$TARGET_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  if git -C "$TARGET_DIR" log --all -p -S "$IOC_APP_ID" 2>/dev/null | head -c1 | read -r _; then
    hit "IOC OAuth app ID found in git history"
  else
    ok "IOC OAuth app ID not in git history"
  fi
fi

section "2. .env files tracked by git (should be ignored)"
if git -C "$TARGET_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  tracked_env=$(git -C "$TARGET_DIR" ls-files | rg '(^|/)\.env($|\.)' | rg -v '\.env\.example$|\.env\.sample$|\.env\.template$' || true)
  if [ -n "$tracked_env" ]; then
    hit "tracked .env files (consider git rm --cached and rotate):"
    printf '  %s\n' "$tracked_env"
  else
    ok "no tracked .env files"
  fi
fi

section "3. API key patterns (AI providers + common secrets)"
PATTERNS=(
  'sk-ant-[A-Za-z0-9_-]{20,}'
  'sk-proj-[A-Za-z0-9_-]{20,}'
  'sk-[A-Za-z0-9]{32,}'
  'AIza[0-9A-Za-z_-]{35}'
  'gsk_[A-Za-z0-9]{30,}'
  'xox[baprs]-[A-Za-z0-9-]{10,}'
  'ghp_[A-Za-z0-9]{36}'
  'github_pat_[A-Za-z0-9_]{30,}'
  'AKIA[0-9A-Z]{16}'
  'SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{30,}'
  '-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----'
)
for p in "${PATTERNS[@]}"; do
  if rg -n --hidden -g '!.git' -g '!node_modules' "$p" "$TARGET_DIR" 2>/dev/null; then
    hit "pattern match: $p"
  fi
done
[ "$hits" -eq 0 ] && ok "no obvious provider key patterns"

section "4. Sensitive-candidate env var names in code (should be Sensitive in Vercel)"
ENV_NAMES='ANTHROPIC_API_KEY|OPENAI_API_KEY|GOOGLE_API_KEY|GEMINI_API_KEY|GROQ_API_KEY|MISTRAL_API_KEY|DEEPSEEK_API_KEY|DATABASE_URL|DIRECT_URL|REDIS_URL|UPSTASH_REDIS_REST_TOKEN|STRIPE_SECRET_KEY|SENDGRID_API_KEY|TWILIO_AUTH_TOKEN|JWT_SECRET|NEXTAUTH_SECRET|SUPABASE_SERVICE_ROLE_KEY|SENTRY_AUTH_TOKEN|AWS_SECRET_ACCESS_KEY|GITHUB_TOKEN|VERCEL_TOKEN'
rg -n --hidden -g '!.git' -g '!node_modules' -g '!scan-secrets.sh' -g '!CHECKLIST.md' "$ENV_NAMES" "$TARGET_DIR" 2>/dev/null \
  | rg -v '\.env\.example|\.env\.sample|\.env\.template' \
  || ok "no matches"

section "5. Vercel config review"
for f in vercel.json .vercel/project.json; do
  full="$TARGET_DIR/$f"
  if [ -f "$full" ]; then
    warn "found $f - review env/build settings"
  fi
done

echo
if [ "$hits" -gt 0 ]; then
  printf "%sDone: %d issue(s) require action.%s\n" "$RED" "$hits" "$RST"
  exit 1
fi
printf "%sDone: no local IOC/key hits. Still complete the checklist (CHECKLIST.md).%s\n" "$GRN" "$RST"
