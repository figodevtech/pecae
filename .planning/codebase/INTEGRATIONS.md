# Integrations — PECAÊ

## 🌐 External Services
- **Supabase**:
    - **Database**: PostgreSQL (managed).
    - **Auth**: Social login (Google) and token management.
    - **Storage**: Vehicle and profile photos (S3-compatible).
- **Resend**: Transactional emails (verification, password reset, notifications).
- **Expo EAS**: Mobile build and deployment pipeline.
- **FCM/APNs**: Push notification delivery via `expo-notifications`.

## 🔄 Internal Service Dependencies
- **Redis (Upstash/Local)**:
    - Used by BullMQ for task persistence.
    - Used for rate-limiting (OTP, login attempts).
- **BullMQ Queues**:
    - `listings`: View counting and async updates.
    - `mail`: Email dispatch.
    - `notifications`: Push notification fan-out.
    - `photo-processing`: Image resizing and thumbnail generation.

## 🔌 API Protocols
- **REST**: Primary communication between mobile and API.
- **Socket.IO**: Real-time communication for the `chat` module.
- **Prisma Client**: Shared internal dependency for all database operations.
