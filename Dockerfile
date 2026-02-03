# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json ./

# If a lockfile exists, use npm ci; otherwise fall back to npm install
# (this repo currently may not include package-lock.json)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copilot SDK spawns the Copilot CLI. Install it inside the image so /command works in containers.
RUN npm install -g @github/copilot

# Copy source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/index.js"]
