FROM oven/bun:1

# Install Node.js so we can run supergateway via npx
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install bun dependencies (gbrain)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy rest of source
COPY . .

# Heroku provides $PORT at runtime
ENV PORT=8787
EXPOSE 8787

# On boot: init DB schema, then run supergateway wrapping gbrain stdio
CMD sh -c "bun run src/cli.ts init --url $DATABASE_URL && npx -y supergateway --stdio 'bun run src/cli.ts serve' --outputTransport streamableHttp --streamableHttpPath /mcp --port ${PORT:-8787} --header 'Authorization: Bearer $HBRAIN_AUTH_TOKEN'"