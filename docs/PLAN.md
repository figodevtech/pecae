# Plano de Trabalho: M11 — Notificações

Este documento define o plano detalhado para o desenvolvimento e implementação do módulo M11, que centraliza o envio de notificações (Push, E-mail e In-App) da plataforma PECAÊ.

---

## 🎯 Objetivos & Critérios de Sucesso
1. **Multi-Canal Best-Effort**: Suportar entrega via Expo Push, Resend API e Supabase Realtime sem bloquear a experiência do usuário.
2. **Conformidade de Preferências**: Respeitar estritamente as flags de canal configuradas pelo usuário.
3. **Persistência Completa**: Salvar logs em formato atômico para manter rastreabilidade histórica.

---

## 💻 Tipo de Projeto & Tech Stack
- **Tipo:** Full Stack (NestJS API + Workers + App Expo Mobile)
- **Tech Stack:** 
  - NestJS + Prisma
  - BullMQ (Fila de Tarefas)
  - Expo Notifications + Resend

---

## 🛠️ Task Breakdown (Execução Individual)

### [x] M11-T01: Schema Prisma (Notification & Logs)
- **Agente:** `database-architect`
- **Ação:** Criar enums de tipo/canal e persistência indexada.


### [x] M11-T02: NotificationService (BullMQ Dispatchers)
- **Agente:** `backend-specialist`
- **Ação:** Enfileiramento em segundo plano sem travar rotas principais.


### [x] M11-T03: Central de Notificações (Full Stack)

#### Backend (Endpoints API)
- **Agente:** `backend-specialist`
- **Ação:** Implementar endpoints em `NotificationController`:
  - `GET /notifications` (Listagem paginada por cursor, ordem desc)
  - `GET /notifications/unread-count` (Contagem de não lidas)
  - `PUT /notifications/:id/read` (Marcar como lida com validação de ownership)
  - `PUT /notifications/read-all` (Marcar todas do usuário como lidas)

#### Mobile (Interface & UX)
- **Agente:** `mobile-developer`
- **Ação:** Criar aba `app/(tabs)/notificacoes.tsx`:
  - `FlatList` otimizada (`useCallback`, `React.memo`, touch target >= 48px).
  - Estratégia de paridade com o banco: Refetch no foco da tela (`useFocusEffect`) e validação via query client (devido ao uso de Postgres local sem Supabase Realtime).
  - UX Premium: Gestos (*Swipe*) para ações rápidas, atualizações otimistas e rollback silencioso.

#### Verificação
- **Agente:** `test-engineer`
- **Ação:** Validar integração ponta a ponta e executar scripts de segurança/lint.

---

## 🏁 Critérios de Saída
Aprovação do fluxo unificado e validação via scripts de teste.
