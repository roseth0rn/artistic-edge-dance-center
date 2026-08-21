# Artistic Edge Dance Center — Coolify build pack: Dockerfile
# No bundler, no build step: npm ci + node server.js. Migrations are
# idempotent and run at boot, so DATABASE_URL is runtime-only.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "server.js"]
