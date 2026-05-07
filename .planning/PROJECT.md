# Projeto PECAÊ

O PECAÊ é um marketplace especializado em peças automotivas de sucatas e desmanches, focado em conectar compradores que buscam economia e precisão técnica com vendedores que possuem veículos para desmonte.

## 🛠️ Stack Tecnológica

### Core
- **Monorepo**: Turborepo
- **Linguagem**: TypeScript

### Backend (`apps/api`)
- **Framework**: NestJS
- **Banco de Dados**: PostgreSQL (via Prisma ORM)
- **Cache/Filas**: Redis (via BullMQ)
- **Autenticação**: Passport + JWT + Google/Apple OAuth
- **Comunicação**: Socket.IO (Chat em tempo real)
- **E-mail**: Resend

### Mobile (`apps/mobile`)
- **Framework**: React Native (via Expo)
- **Navegação**: Expo Router
- **Estado**: Zustand + TanStack Query
- **Estilização**: Sistema de Design Próprio (Industrial Glassmorphism)
- **Formulários**: React Hook Form + Zod

### Infraestrutura
- **Storage**: S3/R2 (via Supabase Storage)
- **Containerização**: Docker / Docker Compose

## 🎯 Objetivos de Negócio
1. **Transparência**: Garantir que o comprador saiba exatamente o estado da peça.
2. **Eficiência**: Busca rápida por marca/modelo/ano e compatibilidade.
3. **Segurança**: Chat integrado e sistema de denúncias/moderação.

## 👥 Papéis
- **Comprador**: Busca peças, gerencia favoritos, negocia via chat.
- **Vendedor**: Cadastra sucatas, gerencia anúncios, responde chat.
- **Moderador**: Audita anúncios e resolve disputas.
- **Administrador**: Gerencia catálogo de veículos e métricas do sistema.
