# Technical Stack — PECAÊ

## 🏗️ Core Architecture
- **Monorepo Management**: [Turbo](https://turbo.build/)
- **Package Manager**: `npm` (v10.8.2)
- **Language**: TypeScript (v5.4+)

## 🔙 Backend (API)
- **Framework**: [NestJS](https://nestjs.com/) (v11.x)
- **ORM**: [Prisma](https://www.prisma.io/) (v5.14)
- **Database**: PostgreSQL (via [Supabase](https://supabase.com/))
- **Auth**: JWT + Refresh Token Rotation + Supabase Auth
- **Queue System**: [BullMQ](https://docs.bullmq.io/) + Redis
- **API Documentation**: Swagger/OpenAPI

## 📱 Frontend (Mobile)
- **Framework**: [React Native](https://reactnative.dev/) (v0.74)
- **SDK**: [Expo](https://expo.dev/) (v51)
- **Routing**: Expo Router (v3.5)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) (v5)
- **Styling**: Nativewind / React Native StyleSheet
- **Forms**: React Hook Form + Zod

## 🛠️ Infrastructure & DevOps
- **Hosting (API)**: Vercel
- **Hosting (Mobile)**: Expo EAS
- **Storage**: Supabase Storage (S3 compatible)
- **Email**: Resend
- **SMS**: SMS Gateway (OTP)
- **Cache**: Redis
