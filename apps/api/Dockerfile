# Use node:22-alpine as base for better performance and smaller size
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# --- Estagio 1: Pruning ---
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
# Cache breaker para forçar cópia de novos arquivos
# Timestamp: 2026-04-25T18:25
COPY . .
RUN turbo prune @pecae/api --docker

# --- Estagio 2: Instalacao de Dependencias ---
FROM base AS installer
# Instalar dependencias de build para pacotes nativos (bcrypt)
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copia apenas o necessario para instalar dependencias
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Copiamos a pasta scripts para que o postinstall do root package.json nao falhe
COPY scripts/ ./scripts/

# Agora podemos rodar o install COM scripts para o bcrypt compilar
RUN npm install

# --- Estagio 3: Build ---
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/ .
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npx turbo run build --filter=@pecae/api --force

# --- Estagio 4: Producao ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copia os artefatos garantindo a propriedade do usuario nestjs
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/entrypoint.sh ./apps/api/entrypoint.sh

USER nestjs

EXPOSE 3000

CMD ["sh", "./apps/api/entrypoint.sh"]
