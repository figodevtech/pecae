# Integrações — PECAÊ

## 🌐 Serviços Externos
- **Supabase**:
    - **Banco de Dados**: PostgreSQL (gerenciado).
    - **Autenticação**: Login social (Google) e gerenciamento de tokens.
    - **Storage**: Fotos de veículos e perfis (compatível com S3).
- **Resend**: E-mails transacionais (verificação, reset de senha, notificações).
- **Expo EAS**: Pipeline de build e deploy mobile.
- **FCM/APNs**: Entrega de notificações push via `expo-notifications`.

## 🔄 Dependências de Serviços Internos
- **Redis (Upstash/Local)**:
    - Usado pelo BullMQ para persistência de tarefas.
    - Usado para rate-limiting (OTP, tentativas de login).
- **Filas BullMQ**:
    - `listings`: Contagem de visualizações e atualizações assíncronas.
    - `mail`: Despacho de e-mails.
    - `notifications`: Fan-out de notificações push.
    - `photo-processing`: Redimensionamento de imagens e geração de thumbnails.

## 🔌 Protocolos de API
- **REST**: Comunicação primária entre mobile e API.
- **Socket.IO**: Comunicação em tempo real para o módulo de `chat`.
- **Prisma Client**: Dependência interna compartilhada para todas as operações de banco de dados.
