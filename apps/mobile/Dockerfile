# Stage 1: Pruning
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @pecae/mobile --docker

# Stage 2: Dependencies
FROM node:22-alpine AS installer
# Build tools for native packages
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY scripts/ ./scripts/
RUN npm install

# Stage 3: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .
RUN npx turbo run build --filter=@pecae/mobile

# Stage 4: Runner (Nginx)
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder
COPY --from=builder /app/apps/mobile/dist .
# Copy custom nginx config
COPY apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
