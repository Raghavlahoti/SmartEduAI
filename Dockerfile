# ==========================================================================
# EduPilot AI - Production Dockerfile
# ==========================================================================

FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency definitions
COPY backend/package*.json ./backend/

# Install production dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy source code
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Expose server port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

WORKDIR /app/backend

# Healthcheck definition
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start production application
CMD ["node", "server.js"]
