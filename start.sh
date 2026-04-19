#!/bin/sh
set -e

echo "Running DB init..."
bun run src/cli.ts init --url "$DATABASE_URL"

echo "Starting supergateway on internal port 8788..."
npx -y supergateway \
  --stdio "bun run src/cli.ts serve" \
  --outputTransport streamableHttp \
  --streamableHttpPath /mcp \
  --port 8788 &

# Give supergateway a second to boot
sleep 3

echo "Starting auth proxy on port ${PORT:-8787}..."
exec node /app/auth-proxy.js