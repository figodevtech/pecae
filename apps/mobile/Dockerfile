# Stage 1: Pruning
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo@2.0.0
# Cache breaker
# Timestamp: 2026-05-26T15:20
COPY . .
RUN turbo prune @pecae/mobile --docker

# Stage 2: Dependencies
FROM node:22-alpine AS installer
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY scripts/ ./scripts/
RUN npm install --legacy-peer-deps

# Stage 3: Build — A variavel EXPO_PUBLIC_API_URL DEVE ser passada como ARG para ser embutida no bundle
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .

# ARG de build-time: injeta a URL da API dentro do bundle JavaScript
ARG EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

RUN npx turbo@2.0.0 run build --filter=@pecae/mobile

# Stage 4: Runner (Nginx com proxy reverso para a API)
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/apps/mobile/dist .
COPY apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
