# Builds the web app and runs the API, which also serves the built app on one origin.
# Used by the staging deployment (render.yaml). See docs/deploy-staging.md.
FROM node:22-slim
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

# Install exactly what bun.lock pins, the same way CI does.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# The browser build talks to the API on the same origin.
ENV VITE_DATA_BACKEND=http
RUN bun run build

ENV NODE_ENV=production \
    API_HOST=0.0.0.0
EXPOSE 10000
# tsx runs the TypeScript server under Node, the same runtime the tests use.
CMD ["node_modules/.bin/tsx", "server/index.ts"]
