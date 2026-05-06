# Architecture — PECAÊ

## 🏗️ Monorepo Design
The project follows a modular monorepo structure managed by Turbo, separating the execution environment (apps) from shared logic (packages).

### 📂 Workspace Layout
- **`apps/api`**: NestJS backend. Modular architecture where each domain (auth, vehicles, chat) is a self-contained module.
- **`apps/mobile`**: React Native/Expo app. Uses Expo Router for file-based navigation and a centralized `src/hooks` and `src/services` layer for API interaction.
- **`packages/shared`**: Shared TypeScript types, interfaces, and enums to ensure type safety across the entire stack.

## 🔄 Data Flow
1. **Client-Server**: Mobile app communicates with the API via REST.
2. **Real-time**: Socket.IO handles the contextualized chat between buyers and sellers.
3. **Async Processing**: BullMQ processes heavy tasks like photo processing, email dispatch, and notification fan-outs.
4. **Database**: Prisma acts as the single source of truth, with Supabase providing the managed PostgreSQL instance.

## 🔐 Security Model
- **Authentication**: JWT-based stateless authentication with short-lived access tokens (15m) and long-lived refresh tokens (7d) stored in `SecureStore` (mobile).
- **Authorization**: Role-Based Access Control (RBAC) via CASL in the API to distinguish between Buyers, Sellers, and Moderators.
- **Data Privacy**: Masquing of sensitive data like vehicle plates (RN08) and absence of Chassi/VIN collection (RN05).
