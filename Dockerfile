# Multi-stage build for production and development
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/properties uploads/units uploads/vacancies uploads/backups uploads/logs
RUN mkdir -p monitoring

# Copy configuration files
COPY .env.example .env
# Don't copy .env file in production

# Build the application
RUN npm run build

# Development stage
FROM base as development
ENV NODE_ENV=development
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production stage
FROM base as production
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Security
RUN addgroup -g appuser && adduser -S -G appuser node
USER node

# Clean up
RUN npm cache clean --force
