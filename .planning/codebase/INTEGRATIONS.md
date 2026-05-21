# INTEGRATIONS.md

## Serviços Externos e Terceiros

### Autenticação e Identidade
- **Google Auth:** Integração via `google-auth-library` para login social com Google.
- **Apple Sign-In:** Integração via `apple-signin-auth`.
- **OTP (SMS/E-mail):** Serviços não explicitamente detalhados (potencialmente Resend para e-mail e Twilio/Zenvia para SMS).

### Armazenamento de Arquivos
- **Supabase Storage:** Utilizado para armazenamento em nuvem de fotos das sucatas/peças e documentos de KYC de lojistas (CNH, Alvará). Links assinados (Signed URLs) e uploads diretos da API/Mobile.

### Notificações
- **Expo Push Notifications:** Utilizado para envio de notificações push transacionais diretamente para os dispositivos mobile.

### Comunicação (E-mail)
- **Resend:** Utilizado para envio transacional de e-mails, como recuperação de senha, confirmação de KYC, etc.

### Mensageria e Cache
- **Redis:** Implementado de forma pesada em três frentes:
  1. Hashes `SHA256` para cache de buscas de peças no catálogo.
  2. Gerenciamento de IP e deduplicação de visualizações (anti-fraude de Ads).
  3. Fila de jobs assíncronos junto com o `BullMQ` (Jobs de listings e ads).
