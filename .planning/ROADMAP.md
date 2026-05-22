# ROADMAP.md

## Cronograma e Fases de Desenvolvimento (Organizado por Milestones)

Este documento detalha o roteiro cronológico de desenvolvimento estruturado por Milestones (Sprints) para mitigar dependências técnicas e agilizar entregas contínuas de valor.

## [CONCLUÍDA] Milestone 1 (Sprint 1) — Fundações: Autenticação & Catálogo Automotivo (Foco: M01 + M04)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v1.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v1.0/v1.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## [CONCLUÍDA] Milestone 2 (Sprint 2) — Perfis de Usuário: Comprador & Vendedor (Foco: M02 + M03)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v2.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v2.0/v2.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## [CONCLUÍDA] Milestone 3 (Sprint 3) — Inventário: Cadastro de Sucatas & Veículos (Foco: M05)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v3.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v3.0/v3.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## [CONCLUÍDA] Milestone 4 (Sprint 4) — Busca, Descoberta e Detalhe de Peças (Foco: M07)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v4.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v4.0/v4.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## [CONCLUÍDA] Milestone 5 (Sprint 5) — Negociação Real-Time: Chat, Mensageria & Push (Foco: M08)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v5.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v5.0/v5.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## [CONCLUÍDA] Milestone 6 (Sprint 6) — Moderação, Qualidade, Alertas e Notificações In-App (Foco: M06 + M09 + M11 + MFA)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v6.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v6.0/v6.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

---

## [CONCLUÍDA] Milestone 7 (Sprint 7) — Monetização: Campanhas de Anúncios Patrocinados (Foco: M13)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v7.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v7.0/v7.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## Milestone 8 (Sprint 8) — Analytics, Dashboards & Assinaturas (Post-MVP) (Foco: M12 + M10)

### M12 — Analytics e Dashboard (P2)
**Descrição:** Módulo de analytics e dashboards para vendedores e administradores. Vendedores visualizam métricas de seus anúncios (views, contatos, taxa de conversão chat/view). Admins visualizam métricas globais da plataforma (DAU, volume de anúncios, receita de assinaturas). Metrics calculadas de forma assíncrona via BullMQ para não impactar performance das queries principais.

- [ ] **M12-T01: Schema Prisma — ListingView, ListingStats e atualização do SellerStats** (Prioridade: P2)
  *Descrição:* Criar model ListingView (registro de view por listing com dedup por IP+24h), ListingStats (aggregates pré-calculados por listing: views30d, chats7d, conversionRate) e atualizar SellerStats existente com campos de analytics.
    - [ ] **M12-T01-ST01:** Models ListingView e ListingStats (Estimativa: 2h)
- [ ] **M12-T02: AnalyticsController — endpoints e registro de views** (Prioridade: P2)
  *Descrição:* Implementar AnalyticsController: POST /listings/:id/view (registrar view com dedup), GET /analytics/seller/me (métricas do vendedor), GET /analytics/admin (métricas globais para Admin). Views registradas assincronamente via BullMQ para não bloquear a tela do anúncio.
    - [ ] **M12-T02-ST01:** Registro assíncrono de views via BullMQ (Estimativa: 3h)
    - [ ] **M12-T02-ST02:** Endpoints de métricas do vendedor e admin (Estimativa: 4h)
- [ ] **M12-T03: BullMQ cron — recálculo periódico de aggregates** (Prioridade: P2)
  *Descrição:* Implementar BullMQ scheduled job (cron) que recalcula ListingStats e SellerStats para todos os vendedores ativos a cada 6 horas. Usar Prisma aggregations (COUNT, AVG) para calcular os valores e atualizar os campos de cache.
    - [ ] **M12-T03-ST01:** Implementar RecalcMetricsWorker com BullMQ cron (Estimativa: 4h)
- [ ] **M12-T04: Dashboard de analytics no app (tela do vendedor)** (Prioridade: P2)
  *Descrição:* Implementar tela de dashboard analytics para vendedor no app: app/(seller)/analytics.tsx. Cards de métricas agregadas, gráfico de linha de views (Victory Native) e lista de anúncios ranqueados por performance.
    - [ ] **M12-T04-ST01:** Dashboard de analytics com Victory Native (Estimativa: 5h)

### M10 — Gestão de Assinaturas (P3)
**Descrição:** Módulo de monetização do PECAÊ via assinaturas para vendedores. Define planos (Gratuito, Pro, Premium) com diferentes quotas de anúncios e features. Integração com Mercado Pago para pagamentos no Brasil. Webhooks para sincronização de status de assinatura. Toda transação financeira é externa — o PECAÊ não processa pagamentos diretamente.

- [ ] **M10-T01: Schema Prisma — Subscription e PlanQuota** (Prioridade: P1)
  *Descrição:* Criar model Subscription no Prisma com: sellerProfileId, plan (SellerPlan enum), status (SubscriptionStatus), externalId (ID do preapproval no Mercado Pago), nextBillingDate, cancelledAt. Adicionar SellerProfile.plan para acesso rápido ao plano atual.
    - [ ] **M10-T01-ST01:** Model Subscription e atualização do SellerProfile (Estimativa: 2h)
- [ ] **M10-T02: SubscriptionController — checkout e gerenciamento de plano** (Prioridade: P1)
  *Descrição:* Implementar SubscriptionController com: POST /subscriptions/checkout { plan } (cria preapproval no Mercado Pago e retorna checkoutUrl), GET /subscriptions/me (plano atual e status), POST /subscriptions/cancel (cancela no Mercado Pago). Integrar Mercado Pago SDK para Node.js.
    - [ ] **M10-T02-ST01:** Integração com Mercado Pago SDK para criação de preapproval (Estimativa: 4h)
    - [ ] **M10-T02-ST02:** Webhook Handler — processar eventos do Mercado Pago (Estimativa: 4h)
- [ ] **M10-T03: Verificação de quota no cadastro de anúncios (M05)** (Prioridade: P0)
  *Descrição:* Adicionar verificação de quota de anúncios ao fluxo de cadastro de sucata (M05). Antes de criar novo Listing, verificar contagem de anúncios PUBLISHED+PENDING_APPROVAL do vendedor contra limite do plano. Retornar 402 Payment Required se quota atingida.
    - [ ] **M10-T03-ST01:** PlanQuotaGuard no endpoint de criação de anúncio (Estimativa: 2h)

### M10 — Gestão de Assinaturas (P3)
**Descrição:** Módulo de monetização do PECAÊ via assinaturas para vendedores. Define planos (Gratuito, Pro, Premium) com diferentes quotas de anúncios e features. Integração com Mercado Pago para pagamentos no Brasil. Webhooks para sincronização de status de assinatura. Toda transação financeira é externa — o PECAÊ não processa pagamentos diretamente.

- [ ] **M10-T01: Schema Prisma — Subscription e PlanQuota** (Prioridade: P1)
  *Descrição:* Criar model Subscription no Prisma com: sellerProfileId, plan (SellerPlan enum), status (SubscriptionStatus), externalId (ID do preapproval no Mercado Pago), nextBillingDate, cancelledAt. Adicionar SellerProfile.plan para acesso rápido ao plano atual.
    - [ ] **M10-T01-ST01:** Model Subscription e atualização do SellerProfile (Estimativa: 2h)
- [ ] **M10-T02: SubscriptionController — checkout e gerenciamento de plano** (Prioridade: P1)
  *Descrição:* Implementar SubscriptionController com: POST /subscriptions/checkout { plan } (cria preapproval no Mercado Pago e retorna checkoutUrl), GET /subscriptions/me (plano atual e status), POST /subscriptions/cancel (cancela no Mercado Pago). Integrar Mercado Pago SDK para Node.js.
    - [ ] **M10-T02-ST01:** Integração com Mercado Pago SDK para criação de preapproval (Estimativa: 4h)
    - [ ] **M10-T02-ST02:** Webhook Handler — processar eventos do Mercado Pago (Estimativa: 4h)
- [ ] **M10-T03: Verificação de quota no cadastro de anúncios (M05)** (Prioridade: P0)
  *Descrição:* Adicionar verificação de quota de anúncios ao fluxo de cadastro de sucata (M05). Antes de criar novo Listing, verificar contagem de anúncios PUBLISHED+PENDING_APPROVAL do vendedor contra limite do plano. Retornar 402 Payment Required se quota atingida.
    - [ ] **M10-T03-ST01:** PlanQuotaGuard no endpoint de criação de anúncio (Estimativa: 2h)

---

