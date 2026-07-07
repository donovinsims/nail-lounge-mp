#!/usr/bin/env bash
# Pre-push guard: block the push if any TRACKED file contains what looks like
# a live secret. Documentation placeholders ("AC...", "re_...", "your-*",
# "<your-...>") intentionally do not match these patterns.
#
# Wired into .husky/pre-push — runs before build/typecheck.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

PATTERNS=(
  'sb_secret_[A-Za-z0-9_-]{20,}'                 # Supabase secret API key
  'eyJ[A-Za-z0-9_-]{30,}\.eyJ[A-Za-z0-9_-]{30,}' # JWT (legacy service-role key shape)
  'AC[0-9a-f]{32}'                               # Twilio Account SID (live shape)
  're_[A-Za-z0-9]{20,}'                          # Resend API key
  'sk_(live|test)_[A-Za-z0-9]{20,}'              # Stripe-style secret key
)

FAIL=0
for pattern in "${PATTERNS[@]}"; do
  hits=$(git grep -I -nE "$pattern" -- ':!bun.lock' ':!package-lock.json' || true)
  if [ -n "$hits" ]; then
    echo "❌ Possible live secret matching /$pattern/:"
    echo "$hits"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 1 ]; then
  echo "Push blocked. Remove and rotate the secret, then retry."
  exit 1
fi

echo "✓ secret scan clean"
