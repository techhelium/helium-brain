FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

ENV PORT=8787
EXPOSE 8787

CMD ["sh", "-c", "bun run src/cli.ts init --url $DATABASE_URL || true && bun run src/cli.ts serve --http --port ${PORT:-8787}"]