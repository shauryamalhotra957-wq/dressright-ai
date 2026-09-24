FROM node:24-slim AS base
WORKDIR /app
COPY package*.json ./
RUN if [ -f package.json ]; then npm install --prefer-offline --no-audit || true; fi
COPY . .
ENV NODE_ENV=production
CMD ["node", "scripts/benchmark_app_engine.mjs"]
