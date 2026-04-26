# Plano de Trabalho: M09 — Painel de Moderação

Este documento define o plano detalhado para o desenvolvimento e implementação do módulo M09, que gerencia a aprovação de anúncios, revisão de documentos (Selo Verificado) e moderação geral no PECAÊ.

---

## 🎯 Objetivos & Critérios de Sucesso
1. **Segurança Robusta (RBAC)**: Controle de acesso baseado em Roles (ADMIN/MODERATOR) usando **CASL** no NestJS.
2. **Aprovação Mandatória**: Nenhum anúncio vai a público sem revisão (RN14).
3. **Plataforma Responsiva**: Interface de moderação funcional nas duas plataformas (Mobile iOS/Android via Expo).
4. **Side Effects**: Integração com BullMQ para alertas e M11 para notificações.

---

## 💻 Tipo de Projeto & Tech Stack
- **Tipo:** Full Stack (API NestJS + App Expo)
- **Tech Stack:**
  - Backend: NestJS + Prisma ORM + PostgreSQL + **CASL** + BullMQ
  - Mobile: React Native (Expo) + Expo Router

---

## 🛠️ Task Breakdown (Execução Individual - 1 por vez)

### [x] M09-T01: RBAC com CASL no NestJS
- **Agente:** `backend-specialist`
- **Ação:** 
  - Instalar `@casl/ability` e `@casl/nestjs`.
  - Criar `CaslAbilityFactory` definindo permissões.
  - Implementar `PoliciesGuard` / Casl Guard para proteger rotas `/moderation/*`.
  - Endpoint `POST /admin/users/:id/role` para promover usuários (Apenas ADMIN).
- **Verificação:** Testes unitários de permissões e tentativa de acesso por usuários comuns (403).

### [x] M09-T02: ModerationController (Fila & Ações)
- **Agente:** `backend-specialist`
- **Ação:**
  - `GET /moderation/listings`: Fila PENDING_APPROVAL (FIFO).
  - `POST /moderation/listings/:id/approve`: Transação atômica + side effects (M11 + BullMQ).
  - `POST /moderation/listings/:id/reject`: Rejeição com motivo obrigatório.
- **Verificação:** Validar status no banco e disparo de jobs.

### [x] M09-T03: Moderação de Documentos (Selo Verificado)
- **Agente:** `backend-specialist`
- **Ação:**
  - `GET /moderation/verifications`: Fila de solicitações.
  - `POST /moderation/verifications/:id/approve` e `/reject`.
  - Geração de Signed URLs do Supabase Storage.
- **Verificação:** Acesso aos documentos e atualização do status `isVerified`.

### [x] M09-T04: Interface Responsiva de Moderação (Mobile)
- **Agente:** `frontend-specialist`
- **Ação:**
  - Criar telas administrativas dentro do app Expo.
  - Listagem de pendentes e detalhes do anúncio com placa mascarada.
- **Verificação:** Teste de usabilidade e responsividade.

---

## 🏁 Módulo Concluído
Todas as tarefas de planejamento foram finalizadas com sucesso.



