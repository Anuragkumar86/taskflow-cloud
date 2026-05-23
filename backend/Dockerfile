# File: taskflow-cloud/backend/Dockerfile
# What this does: Creates a Docker image for the Express backend
# How: Copies your code into a Node.js environment and runs it

# ── Stage 1: Start with official Node.js image ─────────────────────────────
# node:18-alpine = Node.js version 18 on Alpine Linux
# Alpine = tiny Linux distro (~5MB). Regular Ubuntu is ~100MB.
FROM node:20-alpine AS base

# Set the working directory inside the container
# All following commands run from /app
WORKDIR /app

# ── Stage 2: Install dependencies ──────────────────────────────────────────
# Copy package.json FIRST (before your source code)
# Why: Docker caches layers. If package.json hasn't changed,
#      Docker skips re-installing node_modules (faster builds)
COPY package*.json ./
RUN npm ci --only=production
# npm ci = clean install (stricter than npm install, uses lock file exactly)
# --only=production = skip dev dependencies like nodemon (smaller image)

# ── Stage 3: Copy application code ─────────────────────────────────────────
COPY . .

# Tell Docker this container listens on port 5000
EXPOSE 5000

# Create a non-root user (security best practice)
# Running as root inside containers is dangerous
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

# Command to run when container starts
CMD ["node", "server.js"]