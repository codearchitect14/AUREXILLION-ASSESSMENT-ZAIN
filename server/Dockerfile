# ---- Build stage: compile TypeScript to dist/ ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage: production deps + compiled output only ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# SQLite database lives on a volume mounted at /app/data
ENV DB_PATH=/app/data/tickets.db
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 4000

# Seed is idempotent (skips existing data), so it is safe to run on every start.
CMD ["sh", "-c", "node dist/db/seed.js && node dist/index.js"]
