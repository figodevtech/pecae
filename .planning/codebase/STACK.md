# Stack Técnica — PECAÊ

## 🏗️ Arquitetura Core
- **Gerenciamento de Monorepo**: [Turbo](https://turbo.build/)
- **Gerenciador de Pacotes**: `npm` (v10.8.2)
- **Linguagem**: TypeScript (v5.4+)

## 🔙 Backend (API)
- **Framework**: [NestJS](https://nestjs.com/) (v11.x)
- **ORM**: [Prisma](https://www.prisma.io/) (v5.14)
- **Banco de Dados**: PostgreSQL (via [Supabase](https://supabase.com/))
- **Autenticação**: JWT + Rotação de Refresh Token + Supabase Auth
- **Sistema de Filas**: [BullMQ](https://docs.bullmq.io/) + Redis
- **Documentação de API**: Swagger/OpenAPI

## 📱 Frontend (Mobile)
- **Framework**: [React Native](https://reactnative.dev/) (v0.74)
- **SDK**: [Expo](https://expo.dev/) (v51)
- **Roteamento**: Expo Router (v3.5)
- **Gerenciamento de Estado**: [Zustand](https://github.com/pmndrs/zustand)
- **Busca de Dados**: [TanStack Query](https://tanstack.com/query) (v5)
- **Estilização**: Nativewind / React Native StyleSheet
- **Formulários**: React Hook Form + Zod

## 🛠️ Infraestrutura & DevOps
- **Hospedagem (API)**: Vercel
- **Hospedagem (Mobile)**: Expo EAS
- **Storage**: Supabase Storage (compatível com S3)
- **E-mail**: Resend
- **SMS**: Gateway de SMS (OTP)
- **Cache**: Redis
