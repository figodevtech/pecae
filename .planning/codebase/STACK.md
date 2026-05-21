# STACK.md

## Frontend (Mobile)
- **Framework:** React Native com Expo (SDK 51)
- **Roteamento:** Expo Router v3
- **Estado Global:** Zustand (`auth-store`, `vehicle-wizard-store`)
- **Estilização:** StyleQ / Custom Glassmorphism System
- **Data Fetching:** Axios, React Query
- **Validação de Formulários:** React Hook Form com Zod
- **Navegação:** React Navigation
- **Testes:** Jest, React Test Renderer

## Backend (API)
- **Framework:** NestJS v11
- **Linguagem:** TypeScript
- **ORM:** Prisma v5
- **Banco de Dados:** PostgreSQL 16
- **Cache e Filas:** Redis com BullMQ
- **Autenticação:** Passport (JWT, Google OAuth2, Apple Sign-in)
- **Autorização:** CASL Ability
- **WebSockets/SSE:** Socket.io e SSE (Server-Sent Events) no Chat
- **Documentação API:** Swagger (`@nestjs/swagger`)
- **Validação de Dados:** Class-validator, Class-transformer
- **Testes:** Jest, Supertest

## Infraestrutura e Monorepo
- **Gerenciador de Pacotes:** npm
- **Monorepo:** Turborepo (`turbo.json`)
- **Containerização:** Docker e Docker Compose (Postgres, Redis, API)
- **Armazenamento:** Supabase Storage (Fotos e Documentos)
- **Envio de Emails:** Resend
