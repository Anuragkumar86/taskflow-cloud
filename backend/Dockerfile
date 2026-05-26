# File: taskflow-cloud/backend/Dockerfile

FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .


EXPOSE 5000


RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

CMD ["node", "server.js"]