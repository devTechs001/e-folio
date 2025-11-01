# Dockerfile.production
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm ci && npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy necessary files
COPY --from=deps --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/backend ./backend
COPY --from=builder --chown=expressjs:nodejs /app/frontend/build ./frontend/build

# Create directories
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R expressjs:nodejs /app/logs /app/uploads /app/temp

USER expressjs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node backend/healthcheck.js || exit 1

# Start application
CMD ["node", "backend/server.js"]