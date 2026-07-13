# ---- Build stage: produce the static Vite bundle ----
FROM node:24-alpine AS build
WORKDIR /app

# Baked into the static bundle at build time (Vite env convention).
ARG VITE_APP_URL=http://localhost:8080
ENV VITE_APP_URL=$VITE_APP_URL

COPY package*.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build

# ---- Runtime stage: nginx serves the bundle and proxies /api ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
