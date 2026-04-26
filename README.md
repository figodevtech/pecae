# PECAÊ - Manual Técnico e Arquitetural (Developer Guide)

Este é o **Manual Técnico Definitivo** do monorepo PECAÊ. Este documento detalha a arquitetura, as escolhas tecnológicas, os fluxos de todos os módulos implementados (M01 ao M13), e fornece guias operacionais para manutenção e resolução de problemas (troubleshooting).

---

## Índice

1. [Visão Geral e Arquitetura](#1-visão-geral-e-arquitetura)
2. [Infraestrutura e Tecnologias](#2-infraestrutura-e-tecnologias)
3. [Módulos Implementados (Visão Detalhada)](#3-módulos-implementados-visão-detalhada)
   - [M01: Autenticação e Cadastro](#m01-autenticação-e-cadastro)
   - [M02: Perfil do Comprador](#m02-perfil-do-comprador)
   - [M03: Perfil do Vendedor e KYC](#m03-perfil-do-vendedor-e-kyc)
   - [M04 e M05: Catálogo Automotivo e Anúncios](#m04-e-m05-catálogo-automotivo-e-anúncios)
   - [M06: Avaliações e Reputação](#m06-avaliações-e-reputação)
   - [M07: Busca e Descoberta](#m07-busca-e-descoberta)
   - [M08: Chat em Tempo Real](#m08-chat-em-tempo-real)
   - [M09: Painel de Moderação e Segurança](#m09-painel-de-moderação-e-segurança)
   - [M11: Notificações](#m11-notificações)
   - [M12: Analytics Dashboard](#m12-analytics-dashboard)
   - [M13: Ads e Monetização](#m13-ads-e-monetização)
4. [Gerenciamento de Filas e Processos Assíncronos (BullMQ)](#4-gerenciamento-de-filas-e-processos-assíncronos)
5. [Guia de Troubleshooting Avançado](#5-guia-de-troubleshooting-avançado)
6. [Contratos de Configuração (.env)](#6-contratos-de-configuração)
7. [Referência da API (Rotas Swagger)](#7-referência-da-api-rotas-swagger)

---

## 1. Visão Geral e Arquitetura

O PECAÊ é uma plataforma focada na conexão entre vendedores de autopeças (sucatas) e compradores, utilizando uma interface pautada pelo design system **The Digital Forge** (focado em Glassmorphism e alta performance). 

O projeto é estruturado em um **Monorepo (Turborepo)**:
- **`apps/api`**: Backend em NestJS. Concentra toda a lógica de negócio, autenticação (Passport, JWT), controle de acesso (CASL), filas (BullMQ) e persistência de dados (Prisma).
- **`apps/mobile`**: Frontend em React Native (Expo Router), consumindo a API RESTful. Possui forte gerenciamento de estado client-side via Zustand (`auth-store`, `vehicle-wizard-store`).

---

## 2. Infraestrutura e Tecnologias

- **Banco de Dados Relacional:** PostgreSQL 16 (Gerenciado via Prisma ORM). Mantém integridade referencial forte para todos os domínios.
- **Cache e Mensageria:** Redis. Usado intensivamente em três frentes principais:
  1. Hashes para buscas otimizadas no catálogo.
  2. Deduplicação temporal de acessos e cliques (evitando fraude).
  3. Motor principal para a estrutura de filas do BullMQ.
- **Armazenamento de Arquivos:** Supabase Storage para armazenamento em nuvem de fotos de peças e documentos de verificação de lojas (CNH, Alvará).
- **Dockerização:** Multi-stage builds definidos em `apps/api/Dockerfile` e `apps/mobile/Dockerfile`.

### 2.1. Como Executar (Ambiente Docker)

Para subir o ecossistema completo (API + Mobile Web + Banco/Cache), siga os passos abaixo:

**Pré-requisitos:** Docker & Docker Compose instalados.

1. Configure os arquivos `.env` na raiz ou nas respectivas pastas conforme a seção [Contratos de Configuração](#6-contratos-de-configuração).
2. Execute o build e inicialização dos containers:
   ```bash
   # Build das imagens
   docker compose build

   # Inicialização em segundo plano
   docker compose up -d
   ```

*Nota: O backend estará disponível em `http://localhost:3000` e o mobile web no proxy configurado.*

---

## 3. Módulos Implementados (Visão Detalhada)

Abaixo, o fluxo arquitetural de cada módulo documentado nas especificações e implementado no código.

### M01: Autenticação e Cadastro
- **Conceito:** Entrada segura e fluida de usuários.
- **Implementação Backend:** Autenticação multicanal no `AuthController`. Estratégias JWT, OAuth2 (Google) via `@nestjs/passport`, e OTP via SMS/E-mail. 
- **Implementação Mobile:** Gerenciamento da sessão no `auth-store.ts` (Zustand), persistindo no `expo-secure-store`. Interceptors do Axios automatizam renovação (refresh token) e interceptam retornos `401 Unauthorized` forçando logout silencioso.

### M02: Perfil do Comprador
- **Conceito:** Hub de informações para o cliente (Buyer).
- **Implementação:** Relacionamento na tabela `User` com o schema de Garagem (meus carros cadastrados para busca fácil) e Endereços salvos (para cálculo de frete rápido).

### M03: Perfil do Vendedor e KYC
- **Conceito:** O Lojista (Seller) precisa de um processo de auditoria (Conheça Seu Cliente).
- **Implementação:** Criação de `SellerProfile` atrelado ao `User`. Upload de documentos gera entradas em `SellerVerification`. O perfil permanece com a flag `isVerified=false` até que o M09 (Moderação) altere o status para `APPROVED`. Somente vendedores verificados recebem o selo "Verified Badge" na interface pública.

### M04 e M05: Catálogo Automotivo e Anúncios
- **Conceito:** Organização de marcas/modelos e listagem transacional de peças.
- **Fluxo Mobile:** `vehicle-wizard-store.ts` no Zustand gerencia o funil de criação de anúncio em 4 passos (Seleção de Fipe, Dados da Sucata, Inserção de Fotos da Peça, Confirmação de Inventário). Impede requisições HTTP massivas até o submit final.
- **Fluxo Backend:** O Prisma executa transações encadeadas (adicionando veículo, listagem, vinculação ao seller, e links do Supabase das fotos). Ciclo de vida do anúncio transita via enum `VehicleStatus` (`Draft` -> `Active` -> `Sold`).

### M06: Avaliações e Reputação
- **Conceito:** Transparência de qualidade.
- **Implementação:** Compradores podem registrar `Review` atrelado a um `SellerProfile`. Gatilhos no Prisma atualizam dinamicamente a métrica de 5 estrelas agregada no próprio Seller Profile para evitar lentidão com agregação contínua no momento da busca.

### M07: Busca e Descoberta
- **Conceito:** Filtros ultra-rápidos de peças.
- **Implementação Backend:** `SearchService` recebe Query Params, compila um json com os dados de busca, gera um hash `SHA256` e consulta o Redis. Se há "Cache Hit", retorna imediato. Se "Cache Miss", pesquisa no PostgreSQL, salva no Redis com TTL específico, e retorna paginado.

### M08: Chat em Tempo Real
- **Conceito:** Negociação direta entre as partes.
- **Implementação:** Arquitetura RESTful otimizada associada a conexões SSE (Server-Sent Events) no Controller de Chat para emitir novas mensagens a clientes conectados sem depender do overhead do WebSocket.

### M09: Painel de Moderação e Segurança
- **Conceito:** Controle de qualidade do conteúdo e verificação de fraude.
- **Implementação Backend:** Rotas restritas no `ModerationController`.
- **Controle de Acesso:** Implementado pesadamente via biblioteca `CASL`. A `CaslAbilityFactory` mapeia a role `MODERATOR/ADMIN`. Uma regra crítica impede que Moderadores alterem o status dos *próprios* itens (evita auto-aprovação de lojistas-moderadores).

### M11: Notificações
- **Conceito:** Engajamento do usuário.
- **Implementação:** Schema de notificação transacional vinculada ao `userId`. Canais implementados: Push Notifications (usando tokens do Expo) e in-app bell (sininho).

### M12: Analytics Dashboard
- **Conceito:** Visão financeira e de conversão para o lojista.
- **Implementação:** Agregação pesada. Acesso via `/analytics` e endpoints de reconciliação de dados. Retorna contagem diária/semanal de visualizações de sucatas (views), cliques e conversas geradas.

### M13: Ads e Monetização
- **Conceito:** Pulsionamento de sucatas na busca mediante saldo.
- **Implementação Frontend:** Interleaving de listagens (1 anúncio patrocinado a cada N resultados).
- **Implementação Backend:** Processadores do BullMQ (`AdsProcessor`) consomem disparos assíncronos (`track-impression`, `track-click`). Um IP_Hash no Redis garante deduplicação temporária. Os balanços e orçamentos (impressions) são abatidos periodicamente da `AdCampaign` do vendedor.

---

## 4. Gerenciamento de Filas e Processos Assíncronos

Muitas operações de atualização concorrente foram transferidas do Event Loop (HTTP) do NestJS para o **BullMQ**, aumentando escalabilidade.

### Arquitetura de Filas:
- **`listings` Queue:** Gerenciada pelo `ListingsProcessor`.
  - **Uso:** Atualiza o contador de visualizações (`views: { increment: 1 }`).
  - **Prevenção de Flood:** O Job é enviado, mas o Worker só executa a query no Prisma após confirmar que a chave `view:{listingId}:{ip}` não existe no Redis.
- **`ads` Queue:** Gerenciada pelo `AdsProcessor`.
  - **Uso:** Contabilidade financeira da plataforma (cliques e impressões patrocinadas).
  - **Tolerância:** Processamento de jobs retryáveis garantindo que, caso a transação de balanço financeiro falhe por colisão, ela seja repetida de forma segura.

---

## 5. Guia de Troubleshooting Avançado

Este guia serve como base para problemas em produção ou homologação.

### 🔴 Problema: Erro de Build do Docker / Espaço Insuficiente
- **Sintoma:** O build trava na compilação do TypeScript ou acusa falta de espaço em disco.
- **Resolução:**
  1. Limpe o cache do Docker builder:
     ```bash
     docker builder prune -a
     docker system prune -a
     ```
  2. Verifique se há erros estritos de tipagem rodando localmente antes do build:
     ```bash
     npx tsc --noEmit
     ```

### 🔴 Problema: Métricas não estão atualizando (Search, Analytics ou Dashboard)
- **Sintoma:** Um Lojista não vê os acessos do anúncio subirem no seu Dashboard, ou sucatas deletadas continuam sendo exibidas no App.
- **Causa:** O Redis está segurando chaves obsoletas por mais tempo que o TTL esperado, ou a fila do BullMQ está em estado de pausa/bloqueada.
- **Resolução:**
  1. Force a sincronização manual pelo painel administrativo usando a rota `POST /analytics/trigger-recalc`. Isso re-agrega as informações contábeis e de reviews pelo PostgreSQL ignorando o Redis.
  2. Limpe o redis (apenas DEV/STAGING): `docker exec -it pecae-redis redis-cli FLUSHALL`.
  3. Verifique nos logs `docker logs pecae-api` se existem exceções relacionadas ao `ListingsProcessor` falhando com `RedisConnectionError`.

### 🔴 Problema: App Mobile travado na Splash Screen / Erro de Rede Contínuo
- **Sintoma:** App não passa do Login com mensagem de `Network Error`.
- **Causa:** A constante `EXPO_PUBLIC_API_URL` não alcança o servidor ou há um loop de interceptor Axios re-fazendo chamadas `401`.
- **Resolução:**
  1. Revise o `.env` na pasta `apps/mobile`. **Atenção:** Emuladores Android mapeiam localhost para `10.0.2.2`. Em celulares via LAN (Expo Go), não use `localhost`, use `192.168.x.x:3000`.
  2. Apague o cache do Expo local: `npx expo start -c`.
  3. Em caso de loop infinito de refresh token, faça logout manual da `auth-store` limpando o armazenamento nativo e forçando Zustand persist reset.

### 🔴 Problema: Moderador não consegue aprovar (Erro 403 Forbidden)
- **Sintoma:** Requisição de moderação falha com status 403 mesmo logado como moderador.
- **Causa:** O CASL Ability factory restringe edição caso o moderador esteja tentando avaliar seu próprio perfil, ou token JWT com Payload desatualizado sobre Roles.
- **Resolução:** Verifique na tabela `User` as Roles atribuídas a este usuário. Teste se as `policies` no arquivo `casl-ability.factory.ts` estão colidindo na verificação do ID da request com o `ownerId` da `SellerVerification`.

### 🔴 Problema: Jobs Ads caindo no Evento de "Stalled/Failed"
- **Sintoma:** `AdsProcessor` joga dezenas de `Exceptions` no console "Transaction failed".
- **Causa:** Lock de concorrência massiva no PostgreSQL na atualização do Budget ou erro LUA no lado do Redis.
- **Resolução:** A classe `AdsProcessor` realiza retry automático. Monitore as transações Prisma via logs ativados (`new PrismaClient({ log: ['query'] })`). O BullMQ necessita de Redis versão >= 6.2; valide a versão da imagem do Redis no docker-compose.

---

## 6. Contratos de Configuração

Abaixo a documentação exaustiva do arquivo `.env` para orquestração da plataforma.

| Nome da Variável | Escopo | Descrição / Valor Típico |
|------------------|--------|--------------------------|
| `PORT` | API | Porta da API Node.js (Ex: `3000`) |
| `DATABASE_URL` | API | URI de conexão ao PostgreSQL (Ex: `postgresql://user:pass@localhost:5433/pecae`) |
| `REDIS_URL` | API | URI de conexão ao Redis (Ex: `redis://localhost:6379`) |
| `JWT_SECRET` | API | Segredo seguro de 256bits para assinatura simétrica das sessões. |
| `JWT_EXPIRES_IN` | API | Tempo de vida do Token. Recomenda-se curtos ciclos (Ex: `1h` ou `15m`). |
| `SUPABASE_URL` | API | Endereço da API do Supabase para o Bucket (S3/Storage). |
| `SUPABASE_KEY` | API | Chave da Service Role do Supabase. |
| `EXPO_PUBLIC_API_URL`| Mobile | Utilizada estaticamente durante o build para compilar a rota do Axios no React Native (Ex: `http://192.168.x.x:3000/api/v1`). |

---

## 7. Referência da API (Rotas Swagger)

Abaixo estão as rotas completas do backend implementadas via Decorators (`@Controller`) do NestJS e documentadas para acesso rápido (disponíveis de forma interativa via rota Swagger `/api/docs` no servidor):

### 🔑 Autenticação (`/auth`)
- `POST /auth/register`: Cadastro de novo usuário.
- `POST /auth/login`: Login e obtenção de JWT.
- `POST /auth/google`: Login via Google OAuth.
- `POST /auth/phone/send-otp`: Envio de OTP SMS.
- `POST /auth/phone/verify-otp`: Confirmação do OTP.
- `POST /auth/refresh`: Atualização de token JWT expirado.
- `POST /auth/logout`: Invalidação de sessão.
- `POST /auth/verify-email`: Verificação de e-mail KYC básico.
- `POST /auth/forgot-password` / `POST /auth/reset-password`: Fluxo de redefinição de senha.

### 👤 Perfil de Comprador (`/buyers`)
- `GET /buyers/me`: Recupera o perfil do comprador logado.
- `PUT /buyers/me`: Atualiza informações.
- `DELETE /buyers/me`: Exclusão da conta.
- `GET /buyers/favorites/favorites`: Lista anúncios favoritados.
- `POST /buyers/favorites/:listingId`: Favorita um anúncio.
- `GET /buyers/saved-searches`: Lista buscas salvas.
- `POST /buyers/saved-searches`: Registra uma nova busca.
- `DELETE /buyers/saved-searches/:id`: Remove uma busca salva.
- `PATCH /buyers/saved-searches/:id/alert`: Configura alertas.

### 🏪 Perfil de Vendedor (`/sellers`)
- `GET /sellers/me` / `PUT /sellers/me`: Recupera/Edita dados da loja do usuário ativo.
- `GET /sellers/me/stats`: Estatísticas públicas e dashboard básico.
- `POST /sellers`: Cria perfil de vendedor para um usuário.
- `GET /sellers/:id`: Recupera perfil público da loja.
- `GET /sellers/:id/listings`: Lista de todos anúncios ativos da loja.
- `POST /sellers/me/logo`: Solícita URL de envio para logo.
- `POST /sellers/me/logo/confirm`: Confirma o envio e processamento do logo.
- `GET /sellers/verification/status`: Visualiza etapa de verificação.
- `POST /sellers/verification/request`: Inicia o envio de documentação (Alvará/CNH).
- `POST /sellers/verification/confirm`: Envia requisição para moderação.

### 🚘 Catálogo Automotivo (`/catalog`)
- `GET /catalog/brands`: Busca de montadoras (Fiat, Ford, etc.).
- `GET /catalog/brands/:brandId/models`: Modelos associados à marca.
- `GET /catalog/models/:modelId/versions`: Versões específicas de um modelo.
- `GET /catalog/versions/:versionId/years`: Anos de fabricação de uma versão.
- `GET /catalog/part-categories`: Busca de categorias de autopeças.
- `POST /admin/catalog/cache/invalidate`: Invalida cache estático (Admin).

### 🛠️ Anúncios e Inventário de Peças (`/vehicles`, `/listings`)
- `GET /listings`: Busca paginada global do inventário.
- `GET /listings/:id`: Recupera anúncio isolado.
- `POST /vehicles`: Wizard do catálogo - cria uma nova sucata (Draft).
- `GET /vehicles/me`: Retorna apenas os veículos do seller.
- `GET /vehicles/:id`: Busca informações detalhadas e gerenciáveis.
- `PUT /vehicles/:id`: Atualização completa.
- `PATCH /vehicles/:id/parts`: Modifica a lista de "peças disponíveis".
- `PATCH /vehicles/:id/sold`: Altera Lifecycle de um veículo para Vendido.
- `POST /vehicles/:id/photos/upload-url`: Request para URLs assinadas do Bucket.
- `POST /vehicles/:id/photos/confirm`: Persiste as imagens enviadas.

### 🔍 Busca, Descoberta e Filtros (`/search`)
- `GET /search`: Motor de busca centralizado com leitura otimizada no Cache (Redis SHA256).
- `GET /search/suggestions`: Auto-completar e sugestões rápidas de busca.

### 💬 Chat (Tempo Real) (`/chat`)
- `POST /chat/rooms`: Abre/Recupera uma sala com um Seller.
- `GET /chat/rooms`: Lista de salas que o usuário participa.
- `GET /chat/rooms/:id`: Detalhes da sala (meta-dados e status do vendedor).
- `GET /chat/rooms/:id/messages`: Paginação das mensagens textuais de uma conversa.
- `POST /chat/rooms/:id/messages`: Envia mensagem nova na sala (emite SSE).
- `PUT /chat/rooms/:id/read`: Atualiza a flag indicando marcação de leitura (Read Receipts).

### 📢 Notificações (`/notifications`)
- `GET /notifications`: Feed de notificações ativas para o usuário logado.
- `GET /notifications/unread-count`: Retorna badge badge (número de sinalizadores não-lidos).
- `PUT /notifications/read-all`: Marca tudo como lido em lote.
- `PUT /notifications/:id/read`: Confirmação isolada.

### ⭐ Avaliações e Reputação (`/reviews`)
- `POST /reviews`: Comprador avalia a compra feita com um seller (1 a 5 estrelas).
- `GET /sellers/:id/reviews`: Histórico aberto das avaliações do lojista.

### 🛡️ Moderação (`/moderation`, `/verifications`, `/admin/users`)
- `GET /moderation/listings`: Traz lista de todos anúncios submetidos pendentes.
- `GET /moderation/listings/:id`: Detalhes avançados sobre o conteúdo do anúncio.
- `POST /moderation/listings/:id/approve` / `POST /moderation/listings/:id/reject`: Painel de deferimento.
- `GET /moderation/verifications`: Trilha de auditoria pendente de novos vendedores.
- `POST /moderation/verifications/:id/approve` / `POST /moderation/verifications/:id/reject`: Verificação manual de Alvará.
- `GET /verifications/pending`: Status rápido para Admins logados.
- `PUT /verifications/:id/resolve`: Resolve denúncia manual ou caso reaberto.
- `POST /admin/users/:id/role`: Força atribuição de Roles (`BUYER`, `SELLER`, `MODERATOR`).

### 📊 Painel Analytics (`/analytics`)
- `POST /analytics/listings/:id/view`: Rota engatilhada passivamente (via Interceptor) para notificar View Increment (BullMQ `listings` queue).
- `GET /analytics/seller/me`: Dashboards financeiros, CTR e Pageviews agregados.
- `GET /analytics/admin`: Métricas de saude global do sistema (Total Usuários, Lojas Ativas).
- `POST /analytics/trigger-recalc`: Acesso de emergência que re-calcula as views estagnadas lendo o DB primário.

### 🎯 Patrocínios e Monetização (`/ads`)
- `POST /ads/campaigns`: Seller reserva uma quantia (Pacing) para bombar a visibilidade do item.
- `GET /ads/campaigns`: Painel das campanhas atuais.
- `PATCH /ads/campaigns/:id/pause` / `resume` / `cancel`: Lifecycle do Patrocínio (Ativo, Pausado, Encerrado).
- `GET /ads/sponsored`: Retorna peças esporádicas alavancadas via busca.
- `POST /ads/track/impression` / `POST /ads/track/click`: Injeção de engajamento assíncrono tratada com deduplicação nativa LUA+Redis via Fila BullMQ.
- `GET /ads/interstitial/status/:userId`: Checagem programática do Ad Interstitial State.

---
**PECAÊ Development Team - Documentação técnica sujeita a atualizações contínuas de Módulo.**
