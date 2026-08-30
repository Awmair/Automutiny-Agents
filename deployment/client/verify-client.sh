#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

ENV_FILE="apps/web/.env.local"
required=(
  FIRM_NAME
  NEXT_PUBLIC_SITE_URL
  SUPABASE_URL
  SUPABASE_SECRET_KEY
  GROQ_API_KEY
  MODEL_PROVIDER
  MODEL_ID
  CRON_SECRET
)

if [[ ! -f "$ENV_FILE" ]]; then
  printf 'Missing %s. Run deployment/client/setup-client.sh first.\n' "$ENV_FILE" >&2
  exit 1
fi

for key in "${required[@]}"; do
  if ! grep -qE "^${key}=.+" "$ENV_FILE"; then
    printf 'Missing required value: %s\n' "$key" >&2
    exit 1
  fi
done

for folder in intake-brief document-routing stalled-work; do
  test -f "packages/agents/${folder}/README.md"
  test -d "packages/agents/${folder}/src"
  test -d "packages/agents/${folder}/tests"
  test -d "packages/agents/${folder}/evals"
done

node packages/evals/src/run.mjs release
printf 'Client package is structurally ready. Run the full release command before deployment: pnpm release:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build\n'
