# Plano de Implementação: Dockerização do Ecossistema PECAÊ

Este plano detalha a estratégia para containerizar todo o projeto PECAÊ, permitindo a execução local e o deploy em nuvem (AWS/OCI) via Docker Compose.

## 🛠️ Visão Geral Técnica
- **Orquestração**: Docker Compose (V3.8+)
- **Build System**: Turborepo (utilizando `turbo prune`)
- **Backend**: NestJS v11 (Dockerizado em modo produção)
- **Frontend/Mobile**: Expo SDK 51 (Versão Web servida via Nginx)
- **Infraestrutura**: PostgreSQL 16 + Redis 7

---

## 📋 Fase 1: Preparação do Monorepo

### 1.1 Criar `.dockerignore` Global
Evitar que `node_modules`, `.git`, e builds locais entrem no contexto do Docker.

### 1.2 Scripts de Pruning
O Turborepo exige que "podemos" (prune) o monorepo para enviar apenas o necessário para cada container.

---

## 📋 Fase 2: Dockerização do Backend (apps/api)

### 2.1 Criar `apps/api/Dockerfile`
- **Estágio 1 (Pruner)**: Usa `turbo prune @pecae/api --docker`.
- **Estágio 2 (Installer)**: Instala apenas as dependências necessárias.
- **Estágio 3 (Builder)**: Compila o NestJS e gera o cliente Prisma.
- **Estágio 4 (Runner)**: Imagem final leve (alpine) executando `node dist/main`.

### 2.2 Script de Inicialização (`entrypoint.sh`)
Garantir que as migrações do Prisma (`npx prisma migrate deploy`) rodem antes da API iniciar.

---

## 📋 Fase 3: Dockerização do Frontend/Web (apps/mobile)

### 3.1 Criar `apps/mobile/Dockerfile`
- **Estágio 1 (Pruner)**: Usa `turbo prune @pecae/mobile --docker`.
- **Estágio 2 (Builder)**: Roda `npx expo export --platform web`.
- **Estágio 3 (Runner)**: Usa **Nginx** para servir os arquivos estáticos da pasta `dist/`.

### 3.2 Configuração Nginx
Criar um `nginx.conf` básico para lidar com roteamento do Expo Router (SPA).

---

## 📋 Fase 4: Orquestração (docker-compose.yml)

### 4.1 Atualizar `docker-compose.yml` na Raiz
Adicionar os serviços:
- `api`: Depende de `database` e `redis`.
- `mobile-web`: Depende da `api`.

### 4.2 Gerenciamento de Variáveis de Ambiente
Configurar as URLs internas (ex: `DATABASE_URL=postgres://user:pass@database:5432/db`) para comunicação entre containers.

---

## ✅ Critérios de Aceitação
1. `docker-compose up --build` sobe todos os serviços sem erros.
2. A API consegue conectar ao Postgres e Redis internos.
3. O app web é acessível no navegador.
4. O scanner de segurança não aponta segredos nos Dockerfiles.

---

## 🚀 Próximos Passos (PHASE 2)
Após aprovação:
1. Criar Dockerfiles.
2. Atualizar docker-compose.
3. Testar comunicação interna.
