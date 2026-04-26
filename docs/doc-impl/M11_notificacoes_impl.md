# Documentação de Implementação — M11: Notificações

Este documento consolida o relatório técnico da implementação do módulo de notificações multi-canal do PECAÊ.

---

## 🛠️ Modificações Realizadas

### 1. Modelagem do Banco de Dados (`schema.prisma`)
- Adicionadas as entidades:
  - `Notification`: Armazena notificações in-app para os usuários.
  - `NotificationLog`: Registra disparos externos (E-mail e Push) para auditoria e rastreabilidade.
- Enums configurados: `NotificationType` (SYSTEM, MESSAGE, VEHICLE_MATCH, PROMOTION) e `NotificationChannel` (IN_APP, EMAIL, PUSH).

### 2. Backend API & Workers (`apps/api/src/notifications`)
- **Services**:
  - `NotificationService`: Gerenciamento e despacho via filas BullMQ.
  - CRUD completo para consumo do usuário (listagem, contagem, lida, ler todas).
- **Workers**:
  - `NotificationProcessor`: Processador assíncrono para envio de e-mails via Resend e notificações via Expo Push.

### 3. Mobile UI (`apps/mobile`)
- **Aba Notificações (`app/(tabs)/notificacoes.tsx`)**: Listagem paginada infinita, com badges no menu e temas baseados em Industrial Glassmorphism.
- **Estratégias de UX**: Atualização otimista e refetch no foco da tela para máxima fluidez sem Supabase Realtime.

---

## 🚀 Como testar localmente
1. Certifique-se de que o Postgres local esteja rodando e as variáveis de ambiente `.env` (`RESEND_API_KEY`) estejam configuradas.
2. Inicie a API e o aplicativo Expo.
