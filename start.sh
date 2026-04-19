#!/bin/sh
set -e

echo "Running DB init..."
bun run src/cli.ts init --url "$DATABASE_URL"

echo "Starting supergateway with auth..."
exec npx -y supergateway \
  --stdio "bun run src/cli.ts serve" \
  --outputTransport streamableHttp \
  --streamableHttpPath /mcp \
  --port "${PORT:-8787}" \
  --header "Authorization: Bearer ${HBRAIN_AUTH_TOKEN}"