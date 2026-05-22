# ROADMAP.md

## Cronograma e Fases de Desenvolvimento (Organizado por Milestones)

Este documento detalha o roteiro cronológico de desenvolvimento estruturado por Milestones (Sprints) para mitigar dependências técnicas e agilizar entregas contínuas de valor.

## Milestone 1 (Sprint 1) — Fundações: Autenticação & Catálogo Automotivo (Foco: M01 + M04)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v1.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v1.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## [CONCLUÍDA] Milestone 2 (Sprint 2) — Perfis de Usuário: Comprador & Vendedor (Foco: M02 + M03)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v2.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v2.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## [CONCLUÍDA] Milestone 3 (Sprint 3) — Inventário: Cadastro de Sucatas & Veículos (Foco: M05)

> [!NOTE]
> As tarefas e estimativas originais desta Milestone foram arquivadas em [v3.0-ROADMAP.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v3.0-ROADMAP.md) conforme o protocolo de compressão de contexto.

---

## [CONCLUÍDA] Milestone 4 (Sprint 4) — Busca, Descoberta e Detalhe de Peças (Foco: M07)

### M07 — Busca e Descoberta (P0)
**Descrição:** Módulo responsável pela busca e descoberta de sucatas no PECAÊ. Comprador pesquisa por veículo (marca → modelo → ano) e opcionalmente por localização e texto livre (nome da peça). Resultados retornam SEMPRE sucatas completas (veículos), nunca peças avulsas. Usa PostgreSQL Full-Text Search no MVP e migração para OpenSearch na Fase 2.

- [x] **M07-T01: SearchController e SearchService com PostgreSQL Full-Text Search** (Prioridade: P0)
  *Descrição:* Implementar SearchModule no NestJS com GET /search endpoint. Usar Prisma para queries PostgreSQL otimizadas com filtros em cascata (brandId, modelId, yearMin, yearMax, city, state) e busca por texto livre (FTS nas observações e nome do modelo). Paginação cursor-based. Resultados sempre filtrados por Listing.status=PUBLISHED.
    - [x] **M07-T01-ST01:** Implementar SearchService com queries Prisma e filtros em cascata (Estimativa: 5h)
    - [x] **M07-T01-ST02:** Cache Redis para resultados de busca frequentes (Estimativa: 3h)
    - [x] **M07-T01-ST03:** Endpoint de sugestões de autocomplete de busca (Estimativa: 3h)
- [x] **M07-T02: Telas de busca e resultados no app React Native** (Prioridade: P0)
  *Descrição:* Implementar tela principal de busca app/(tabs)/busca.tsx com VehicleSelector em modo search, tela de resultados app/resultados.tsx com FlashList e paginação infinita, e tela de detalhe app/anuncio/[id].tsx com galeria de fotos, peças disponíveis e botão de chat.
    - [x] **M07-T02-ST01:** Tela de busca (app/(tabs)/busca.tsx) com filtros (Estimativa: 4h)
    - [x] **M07-T02-ST02:** Tela de resultados com FlashList e paginação infinita (Estimativa: 4h)
    - [x] **M07-T02-ST03:** Tela de detalhe do anúncio (app/anuncio/[id].tsx) (Estimativa: 6h)
- [x] **M07-T03: ListingController e endpoint de detalhe** (Prioridade: P0)
  *Descrição:* Implementar ListingController com GET /listings/:id que retorna dados completos de um anúncio para a tela de detalhe. Incluir Vehicle, VehiclePhotos, SellerProfile (dados públicos) e PartCategory names. Endpoint público (@Public()).
    - [x] **M07-T03-ST01:** Implementar GET /listings/:id e ListingDetailResponseDto (Estimativa: 4h)
    - [x] **M07-T03-ST02:** Incremento assíncrono de views e contagem de favoritos (Estimativa: 2h)
    - [x] **M07-T03-ST03:** Compartilhamento de anúncios e deep links (Estimativa: 2h)
- [x] **M07-T04: Preparação para migração para OpenSearch (Fase 2)** (Prioridade: P2)
  *Descrição:* Documentar a estratégia de migração do PostgreSQL Full-Text Search para OpenSearch na Fase 2. Definir índices OpenSearch, mapping de campos e estratégia de sincronização. Preparar SearchService para suportar ambas as implementações via Strategy Pattern.
    - [x] **M07-T04-ST01:** Definir interface ISearchStrategy e padrão Strategy no SearchService (Estimativa: 3h)
    - [x] **M07-T04-ST02:** Estratégia de sincronização com OpenSearch (documento de arquitetura) (Estimativa: 2h)
    - [x] **M07-T04-ST03:** Testes de performance da busca PostgreSQL (baseline) (Estimativa: 3h)

---

## Milestone 5 (Sprint 5) — Negociação Real-Time: Chat, Mensageria & Push (Foco: M08)

### M08 — Chat e Negociação (P0)
**Descrição:** Módulo de comunicação em tempo real entre comprador e vendedor usando Supabase Realtime. Toda negociação ocorre exclusivamente via chat vinculado a um anúncio específico. Não há preços, transações financeiras ou pagamentos no chat — é apenas a interface de negociação textual. Chat só pode ser iniciado em anúncios com status PUBLISHED (RN11).

- [ ] **M08-T01: Schema Prisma — ChatRoom, ChatMessage e ChatRead** (Prioridade: P0)
  *Descrição:* Criar entidades ChatRoom (sala de chat 1:1 entre comprador e vendedor por anúncio), ChatMessage (mensagem individual) e ChatRead (controle de leitura por usuário para contador de não lidas) no Prisma.
    - [ ] **M08-T01-ST01:** Escrever models ChatRoom, ChatMessage e ChatRead (Estimativa: 3h)
    - [ ] **M08-T01-ST02:** Configurar Supabase Realtime para tabela chat_message (Estimativa: 2h)
- [ ] **M08-T02: ChatController e ChatService — Endpoints REST** (Prioridade: P0)
  *Descrição:* Implementar ChatModule com endpoints: POST /chat/rooms (criar/buscar sala), GET /chat/rooms (listar salas do usuário), GET /chat/rooms/:id/messages (histórico paginado), POST /chat/rooms/:id/messages (enviar mensagem), PUT /chat/rooms/:id/read (marcar como lida).
    - [ ] **M08-T02-ST01:** Implementar POST /chat/rooms com upsert idempotente (Estimativa: 3h)
    - [ ] **M08-T02-ST02:** Endpoint POST /messages e send de mensagem com Realtime (Estimativa: 4h)
    - [ ] **M08-T02-ST03:** GET /chat/rooms com lista de conversas e unreadCount (Estimativa: 3h)
- [ ] **M08-T03: Tela de chat no app React Native com Supabase Realtime** (Prioridade: P0)
  *Descrição:* Implementar tela de chat app/chat/[roomId].tsx com: header do anúncio, lista de mensagens invertida (mais recentes embaixo), input de mensagem, integração com Supabase Realtime para receber mensagens em tempo real, paginação de histórico e marcação automática de lida.
    - [ ] **M08-T03-ST01:** Implementar Supabase Realtime subscription no app (Estimativa: 4h)
    - [ ] **M08-T03-ST02:** Tela de chat com FlatList invertida e MessageBubble (Estimativa: 5h)
    - [ ] **M08-T03-ST03:** Tela de lista de conversas (aba Mensagens) (Estimativa: 3h)
- [ ] **M08-T04: Push Notifications para mensagens de chat (via BullMQ + Expo)** (Prioridade: P0)
  *Nota de Dependency:* A infraestrutura de envio utiliza a fila BullMQ e deve se apoiar nas preferências do M02, com o log consolidado no M11.
  *Descrição:* Implementar worker BullMQ 'send-push-notification' que envia push notifications via Expo Push Notification API para usuários com o app em background. Salvar Expo Push Token no banco. Respeitar preferências de notificação (NotificationPreferences do M02).
    - [ ] **M08-T04-ST01:** Registro de PushToken ao login no app (Estimativa: 3h)
    - [ ] **M08-T04-ST02:** Worker BullMQ para envio de push notifications (Estimativa: 3h)
    - [ ] **M08-T04-ST03:** Handler de deep link ao tocar na push notification (Estimativa: 2h)

---

## Milestone 6 (Sprint 6) — Moderação, Qualidade, Alertas e Notificações In-App (Foco: M06 + M09 + M11 + MFA)

### M06 — Avaliações e Reputação (P1)
**Descrição:** Módulo de avaliação de vendedores após uma negociação concluída. Comprador avalia o vendedor com nota (1-5 estrelas) e comentário opcional. Rating média exibida publicamente no perfil do vendedor (M03). Busca de sucatas pode ordenar por rating. Vendedor não avalia comprador nesta versão.

- [ ] **M06-T01: Schema Prisma — Review** (Prioridade: P1)
  *Descrição:* Criar model Review no Prisma com: sellerProfileId, buyerId, chatRoomId (@unique para garantir 1 avaliação por negociação), rating (1-5), comment? e timestamps. Adicionar campo rating ao SellerStats.
    - [ ] **M06-T01-ST01:** Escrever model Review e atualizar SellerStats (Estimativa: 2h)
    - [ ] **M06-T01-ST02:** ReviewService e ReviewController — CRUD de avaliações (Estimativa: 4h)
    - [ ] **M06-T01-ST03:** Worker BullMQ para recálculo de rating do vendedor (Estimativa: 2h)
- [ ] **M06-T02: Tela de avaliação e exibição de reviews no app** (Prioridade: P1)
  *Descrição:* Implementar tela ou modal de avaliação dentro do chat (app/chat/[roomId]/avaliar.tsx). Exibir histórico de avaliações em chips de estrelas e comentários no perfil público do vendedor (M03).
    - [ ] **M06-T02-ST01:** Componente StarRatingPicker e tela/modal de avaliação (Estimativa: 3h)
    - [ ] **M06-T02-ST02:** Seção de avaliações no perfil público do vendedor (M03) (Estimativa: 2h)

### M09 — Painel de Moderação (P0)
**Descrição:** Painel de moderação exclusivo para Admins/Moderadores da equipe PECAÊ. Responsável pela aprovação ou rejeição de anúncios cadastrados pelos vendedores (RN14). Central de revisão de documentos de verificação (Selo Verificado, M03) e denúncias de usuários. Nenhum anúncio vai a público sem aprovação (RN14).

- [ ] **M09-T01: RBAC — Roles Admin e Moderador com CASL no NestJS** (Prioridade: P0)
  *Descrição:* Implementar controle de acesso baseado em roles (RBAC) usando CASL no NestJS. Criar roles ADMIN e MODERATOR no model User. Criar guard AdminGuard/@Roles decorator para proteger todos os endpoints /moderation/*. Garantir que RN15 seja aplicado em nível de infraestrutura.
    - [ ] **M09-T01-ST01:** Enum UserRole no Prisma e RolesGuard no NestJS (Estimativa: 3h)
- [ ] **M09-T02: ModerationController — fila de anúncios pendentes e ações de approve/reject** (Prioridade: P0)
  *Descrição:* Implementar ModerationController com: GET /moderation/listings (fila de PENDING_APPROVAL com filtros e paginação), GET /moderation/listings/:id (detalhes completos), POST /moderation/listings/:id/approve, POST /moderation/listings/:id/reject { rejectionReason }.
    - [ ] **M09-T02-ST01:** Endpoints de fila de moderação e detalhes do anúncio (Estimativa: 3h)
    - [ ] **M09-T02-ST02:** Endpoints de approve e reject com side effects (Estimativa: 4h)
- [ ] **M09-T03: Moderação de documentos de verificação (Selo Verificado)** (Prioridade: P0)
  *Descrição:* Implementar fila de revisão de VerificationRequests (Selo Verificado do M03). Endpoints: GET /moderation/verifications (fila PENDING), POST /moderation/verifications/:id/approve, POST /moderation/verifications/:id/reject { reason }.
    - [ ] **M09-T03-ST01:** Endpoints de moderação de VerificationRequests (Estimativa: 3h)

### M11 — Notificações (P0)
**Descrição:** Módulo centralizador de todas as notificações do PECAÊ: push notifications (via Expo/FCM/APNs), e-mails transacionais (via Resend API) e notificações in-app em tempo real (via Supabase Realtime). Outros módulos chamam NotificationService para disparar notificações. Respeita preferências de canal configuradas pelo usuário (M02).

- [ ] **M11-T01: Schema Prisma — Notification e NotificationLog** (Prioridade: P0)
  *Descrição:* Criar model Notification (histórico in-app) e NotificationLog (log de entregas por canal) no Prisma. Notification é a entidade principal persistida para o histórico do usuário. NotificationLog rastreia resultado de envio por canal (push/email).
    - [ ] **M11-T01-ST01:** Escrever models Notification e NotificationLog (Estimativa: 2h)
- [ ] **M11-T02: NotificationService — centro de envio multi-canal** (Prioridade: P0)
  *Descrição:* Implementar NotificationModule com NotificationService.send() que: persiste Notification no banco, emite via Supabase Realtime (CDC automático), e enfileira jobs BullMQ para push e e-mail conforme preferências do usuário e tipo da notificação.
    - [ ] **M11-T02-ST01:** Implementar NotificationService.send() com persistência e BullMQ (Estimativa: 4h)
    - [ ] **M11-T02-ST02:** Worker de push notifications e worker de e-mail (Resend) (Estimativa: 4h)
- [ ] **M11-T03: Central de notificações no app (aba Notificações)** (Prioridade: P0)
  *Descrição:* Implementar tela app/(tabs)/notificacoes.tsx com lista de notificações do usuário, badge de não lidas no tab, marcação de lida ao tocar, e integração Supabase Realtime para novas notificações em tempo real.
    - [ ] **M11-T03-ST01:** NotificationController — endpoints de listagem e leitura (Estimativa: 3h)
    - [ ] **M11-T03-ST02:** Tela de notificações com Realtime e navegação contextual (Estimativa: 4h)

### M_favoritos_alertas — Favoritos e Alertas de Busca (P1)
**Descrição:** Módulo que gerencia a lista de anúncios favoritados pelo comprador e as buscas salvas com alertas. Quando um novo anúncio é publicado (após aprovação da moderação no M09), o sistema verifica todas as SavedSearches com alertActive=true e notifica compradores com filtros compatíveis via push notification e in-app.

- [ ] **MFA-T01: Worker BullMQ de matching de alertas** (Prioridade: P1)
  *Descrição:* Implementar worker BullMQ 'match-alerts' que é invocado quando um novo anúncio é publicado. Busca todas as SavedSearches ativas, avalia compatibilidade de filtros com o novo veículo, e enfileira jobs de push notification para matches encontrados.
    - [ ] **MFA-T01-ST01:** Implementar matchFilters e dispatch de notificações (Estimativa: 5h)
    - [ ] **MFA-T01-ST02:** Integração com M09 — disparar job ao publicar anúncio (Estimativa: 2h)
- [ ] **MFA-T02: Telas de favoritos e buscas salvas (extensão do M02)** (Prioridade: P1)
  *Descrição:* Estender as telas já definidas no M02 (app/(buyer)/favoritos.tsx e app/(buyer)/buscas-salvas.tsx) com integrações do sistema de alertas. Adicionar badge de estado de alerta nas buscas salvas e indicação de anúncio salvo nos cards de favoritos (verificar se ainda PUBLISHED).
    - [ ] **MFA-T02-ST01:** SavedSearchCard com toggle de alerta e badge de status (Estimativa: 3h)
    - [ ] **MFA-T02-ST02:** Badge de disponibilidade em anúncios favoritados (Estimativa: 2h)

---

## Milestone 7 (Sprint 7) — Monetização: Campanhas de Anúncios Patrocinados (Foco: M13)

### M13 — Anúncios e Publicidade In-App (P1)
**Descrição:** Módulo de monetização via publicidade in-app do PECAÊ. Suporta dois tipos de anúncios: (1) Anúncios programáticos via Google AdMob (banners e intersticiais automáticos gerenciados pelo ecossistema Google), e (2) Anúncios Diretos — desmanches que pagam para ter seus anúncios destacados nas listagens de busca (Sponsored/Patrocinado). O módulo inclui painel admin para gestão de campanhas diretas, configuração de frequência e posicionamento de anúncios AdMob, e tracking de impressões e cliques para relatórios de performance.

- [ ] **M13-T01: Schema Prisma — AdCampaign, AdImpression, AdClick e flag no Listing** (Prioridade: P0)
  *Descrição:* Criar models de banco para o sistema de anúncios diretos: AdCampaign (campanha vinculada a um Listing), AdImpression (registro de cada impressão) e AdClick (registro de cada clique). Adicionar flag isSponsoredActive ao model Listing existente para queries eficientes de sponsored na busca.
    - [ ] **M13-T01-ST01:** Adicionar flag isSponsoredActive ao Listing e migration (Estimativa: 1h)
    - [ ] **M13-T01-ST02:** Models AdCampaign, AdImpression e AdClick (Estimativa: 2h)
    - [ ] **M13-T01-ST03:** AdCampaignService — lógica de expiração e verificações de criação (Estimativa: 2h)
- [ ] **M13-T02: AdController — endpoints de campanha (Admin) e tracking (público)** (Prioridade: P0)
  *Descrição:* Implementar AdController com endpoints admin (POST /admin/campaigns, GET /admin/campaigns, PATCH /admin/campaigns/:id, DELETE /admin/campaigns/:id) e endpoints públicos de tracking (POST /ads/track/impression, POST /ads/track/click). Endpoints admin protegidos por RolesGuard ADMIN.
    - [ ] **M13-T02-ST01:** DTOs de campanha e endpoints Admin CRUD (Estimativa: 3h)
    - [ ] **M13-T02-ST02:** Endpoints de tracking — impression e click (fire-and-forget) (Estimativa: 2h)
    - [ ] **M13-T02-ST03:** Worker BullMQ de tracking — processar impressões e cliques (Estimativa: 3h)
- [ ] **M13-T03: Integração com M07 — injeção de Sponsored Listings nos resultados de busca** (Prioridade: P0)
  *Descrição:* Modificar SearchService (M07) para injetar até 2 Sponsored Listings no início da resposta de busca, com base no targeting da campanha (brandId, city, state) e os filtros da busca do usuário. Usar cache Redis de 60s para o resultado de getSponsoredForSearch.
    - [ ] **M13-T03-ST01:** getSponsoredForSearch com Redis cache e injeção no SearchService (Estimativa: 3h)
    - [ ] **M13-T03-ST02:** SponsoredListingCard no app — badge e tracking de impressão (Estimativa: 2h)
- [ ] **M13-T04: Integração Google AdMob SDK no app React Native** (Prioridade: P1)
  *Descrição:* Instalar e configurar react-native-google-mobile-ads no Expo. Implementar consentimento CMP (UMP SDK) para LGPD compliance. Configurar BannerAd em telas de busca e detalhes do anúncio. Configurar InterstitialAd com frequência capping de 30 minutos via AsyncStorage.
    - [ ] **M13-T04-ST01:** Instalação e configuração do react-native-google-mobile-ads no Expo (Estimativa: 3h)
    - [ ] **M13-T04-ST02:** BannerAd nas telas de busca e detalhes do anúncio (Estimativa: 2h)
    - [ ] **M13-T04-ST03:** InterstitialAd com frequência capping de 30 minutos (Estimativa: 2h)
- [ ] **M13-T05: Painel Admin de Campanhas e Dashboard de Performance de Anúncios** (Prioridade: P1)
  *Descrição:* Construir interface admin de gestão de campanhas de Sponsored Listings. Como o painel admin pode ser web ou mobile, implementar telas para: listar campanhas com métricas (CTR, impressões, cliques), criar nova campanha, visualizar detalhes de campanha com gráfico de impressões por dia (integrado ao M12), pausar e cancelar campanhas.
    - [ ] **M13-T05-ST01:** Endpoint GET /admin/campaigns/:id com timeline de impressões (Estimativa: 2h)
    - [ ] **M13-T05-ST02:** Tela admin de lista de campanhas com busca e filtros (Estimativa: 3h)
    - [ ] **M13-T05-ST03:** Formulário de criação de campanha com autocomplete de Listings (Estimativa: 3h)

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

