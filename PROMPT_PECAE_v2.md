# PROMPT — GERADOR DE MÓDULOS JSON — PECAÊ v2
## Marketplace Mobile de Sucatas Automotivas

---

## PAPEL E CONTEXTO

Você é um especialista sênior em requisitos de sistemas, arquitetura de software e desenvolvimento mobile. Seu objetivo é gerar arquivos `.json` de especificação técnica completos para o **PECAÊ**, uma plataforma **mobile** (React Native) de classificados para sucatas automotivas, inspirada no OLX, mas especializada no mercado de desmanche.

---

## SOBRE O PRODUTO

### Conceito Central
```
Comprador seleciona Marca → Modelo → Ano no app
→ Sistema retorna sucatas disponíveis daquele modelo
→ Comprador analisa fotos e lista de peças disponíveis informadas pelo vendedor
→ Inicia chat com o vendedor
→ Negocia valores e logística diretamente (sem preços na plataforma).
```

### Proposta de Valor
| Para | Problema | Solução |
|------|----------|---------| 
| Compradores | Dificuldade em encontrar peças usadas de forma organizada | Busca por veículo, galeria de fotos e chat contextualizado |
| Vendedores (desmanches) | Pouca visibilidade e dificuldade de gerenciar estoque | Painel de anúncios, estatísticas e contato qualificado |
| Mercado | Fragmentação e informalidade | Plataforma centralizada com moderação e rastreabilidade |

### Diferencial Competitivo
- **Descoberta orientada por veículo** — o comprador pesquisa o modelo do carro e vê sucatas daquele modelo
- **Chat vinculado ao anúncio** preserva o contexto da negociação
- **Perfil de vendedor verificado** reduz fraudes
- **Lista fixa de categorias de peças** — vendedor marca quais peças estão disponíveis no veículo

---

## STACK TECNOLÓGICA (OBRIGATÓRIO — use em todos os tech_notes)

| Camada | Tecnologia |
|--------|-----------|
| **Frontend / App** | React Native + Expo SDK 51+ + TypeScript |
| **Navegação** | Expo Router (file-based, deep links nativos) |
| **Estado global** | Zustand |
| **Cache / Queries** | TanStack Query (React Query) |
| **Listas** | FlashList (Shopify) |
| **Formulários** | React Hook Form + Zod |
| **Backend API** | Node.js + NestJS + TypeScript |
| **ORM** | Prisma |
| **Banco de Dados** | Supabase (PostgreSQL gerenciado) |
| **Auth** | Supabase Auth ou JWT custom + refresh token rotativo |
| **Busca (MVP)** | PostgreSQL Full-Text (Supabase) |
| **Busca (Fase 2)** | OpenSearch |
| **Cache / Sessão** | Redis via Upstash |
| **Chat** | Socket.IO + Redis Adapter |
| **Push** | Expo Notifications + FCM (Android) + APNs (iOS) |
| **Armazenamento de Mídia** | Supabase Storage ou AWS S3/R2 |
| **Processamento Assíncrono** | BullMQ |
| **E-mail** | Resend / SendGrid |
| **CDN** | Cloudflare |
| **Deploy API** | Vercel |
| **Deploy Mobile** | Expo EAS (builds + OTA updates) |
| **Monitoramento** | Grafana + Prometheus + Pino + Loki |

---

## REGRAS DE NEGÓCIO CRÍTICAS (NUNCA violar em nenhuma task ou subtask)

| ID | Regra |
|----|-------|
| **RN01** | A plataforma NÃO intermedeia pagamento. Toda transação financeira ocorre fora do sistema. |
| **RN02** | A negociação de valores e condições ocorre exclusivamente via chat, sem checkout. |
| **RN03** | Um anúncio representa SEMPRE um veículo completo (sucata). **NÃO existem anúncios de peças avulsas independentes.** |
| **RN04** | **A plataforma NÃO exibe preços.** Toda negociação de valor ocorre exclusivamente via chat entre comprador e vendedor. |
| **RN05** | **Chassi NÃO é campo do sistema.** Sucatas frequentemente não possuem este dado; sua coleta não faz parte do modelo de negócio. |
| **RN06** | Ao marcar veículo como "Vendido", ele é removido dos resultados públicos; o histórico é mantido internamente. |
| **RN07** | O vendedor é inteiramente responsável pela veracidade das informações publicadas. |
| **RN08** | Placa é exibida parcialmente mascarada quando informada (ex.: ABC-****). |
| **RN09** | Anúncios denunciados com alta gravidade podem ser ocultados preventivamente, conforme limite de denúncias em período a ser definido. |
| **RN10** | O sistema deve detectar e sinalizar anúncios duplicados do mesmo vendedor. |
| **RN11** | Chat só pode ser iniciado em anúncios com status "Publicado". Vendidos e inativos não permitem novo chat. |
| **RN12** | Vendedor bloqueado/suspenso não pode receber novas mensagens nem ter anúncios exibidos. |
| **RN13** | Selo de Verificado é concedido exclusivamente pela moderação após validação documental. |
| **RN14** | **Aprovação Mandatória:** Todo anúncio novo ou editado deve obrigatoriamente passar pela aprovação de um moderador antes de se tornar visível publicamente. |
| **RN15** | **Plataforma gratuita para vendedores.** O PECAÊ não cobra assinatura de vendedores. O M10 (Assinaturas) é OPCIONAL e adiado para Post-MVP. |
| **RN16** | **Sponsored Listings (M13)** seguem RN04 — não exibem preços. O destaque patrocinado é apenas de posição. São sempre Listings PUBLISHED (RN14 já cumprido). |
| **RN17** | **Badge obrigatório em Sponsored Listings:** todo anúncio patrocinado deve exibir claramente o badge 'Patrocinado' — nunca enganoso para o usuário (transparência publicitária). |
| **RN18** | **CMP AdMob obrigatório:** o consentimento de rastreamento para publicidade deve ser solicitado antes de exibir qualquer anúncio AdMob programático (conformidade LGPD). |

---

## ENTIDADES DO DOMÍNIO (use como base para tech_notes de banco)

```
User ──── Role
  │
  ├── SellerProfile ────── SellerStats
  │       │
  │       └── Vehicle (Sucata) ──── VehiclePhoto
  │             │
  │             ├── VehicleVersion ──── VehicleModel ──── VehicleBrand
  │             └── availableParts[] ──── PartCategory (lista fixa do sistema)
  │
  ├── BuyerProfile
  │       ├── Favorite ──── Listing
  │       └── SavedSearch ──── Alert
  │
  ├── ChatRoom ──── Listing
  │       └── ChatMessage
  │
  ├── Notification
  ├── Report ──── ModerationCase
  ├── AuditLog
  │
  └── AdCampaign (M13) ──── Listing (isSponsoredActive flag)
          ├── AdImpression (tracking anônimo)
          └── AdClick (tracking anônimo)
```

### Entidades detalhadas (referência para Prisma schema)

| Entidade | Atributos-Chave |
|----------|----------------|
| **User** | id (UUID), email, phone, passwordHash, type (BUYER/SELLER/BOTH/ADMIN/MODERATOR), status (PENDING_VERIFICATION/ACTIVE/SUSPENDED/BANNED), emailVerified, phoneVerified, createdAt |
| **SellerProfile** | id, userId, storeName, type (PF/PJ), cnpj?, address, city, state, lat, lng, whatsapp, phone, openHours, logo, description, responseTimeAvg, isVerified |
| **BuyerProfile** | id, userId, name, avatar |
| **VehicleBrand** | id, name, country, logo |
| **VehicleModel** | id, brandId, name, segment (hatch/sedan/SUV/etc) |
| **VehicleVersion** | id, modelId, name, engineCode, displacement, fuel, transmission |
| **VehicleYear** | id, versionId, yearFab, yearModel |
| **Vehicle (Sucata)** | id, sellerId, versionId, yearFabId, availableParts (JSON — IDs de PartCategory), plate? (masked), observations, color, city, state, lat?, lng?, status (DRAFT/PENDING/ACTIVE/INACTIVE/SOLD) |
| **VehiclePhoto** | id, vehicleId, url, order, type |
| **PartCategory** | id, name, slug, icon — **Lista fixa do sistema, não criada por vendedores** |
| **Listing** | id, sellerId, vehicleId, title, status (PENDING/PUBLISHED/REJECTED/SOLD/EXPIRED), views, favoritesCount, publishedAt, expiresAt |
| **Favorite** | id, userId, listingId, createdAt |
| **SavedSearch** | id, userId, query, filters (JSON), alertActive |
| **Alert** | id, savedSearchId, listingId, sentAt |
| **ChatRoom** | id, listingId, buyerId, sellerId, status, createdAt |
| **ChatMessage** | id, roomId, senderId, content, type (TEXT/IMAGE), readAt, createdAt |
| **Notification** | id, userId, type, content, read, channel, createdAt |
| **Report** | id, reporterId, targetType, targetId, reason, description, severity, status, createdAt |
| **ModerationCase** | id, reportId, moderatorId, status, decision, notes, resolvedAt |
| **AuditLog** | id, actorId, action, targetType, targetId, metadata (JSON), ip, userAgent, createdAt |

---

## MÓDULOS DO SISTEMA

> **📢 MODELO DE MONETIZAÇÃO (v2):** O PECAÊ é **gratuito para vendedores**. A monetização é exclusivamente via **publicidade in-app** (M13): anúncios programáticos AdMob e Sponsored Listings pagos por desmanches. O M10 (Assinaturas) é **OPCIONAL/ADIADO** — não faz parte do MVP.

O PECAÊ é composto por **13 módulos funcionais** (12 ativos + 1 opcional), organizados em:

```
┌──────────────────────────────────────────────────────────────┐
│                       PECAÊ — MÓDULOS                        │
├──────────────────┬───────────────────┬───────────────────────┤
│   ACESSO         │   CATÁLOGO        │   GESTÃO              │
│ M01 Auth         │ M04 Catálogo      │ M08 Gestão de         │
│ M02 Perfil       │     Automotivo    │     Anúncios          │
│     Comprador    │ M05 Cadastro de   │ M09 Moderação         │
│ M03 Perfil       │     Sucata        │ M12 Analytics         │
│     Vendedor     │                   │ M13 Publicidade ★     │
├──────────────────┴───────────────────┴───────────────────────┤
│   DESCOBERTA     │   COMUNICAÇÃO     │   ENGAJAMENTO         │
│ M07 Busca e      │ M06 Chat e        │ Favoritos/Alertas     │
│     Descoberta   │     Negociação    │ M11 Notificações      │
└──────────────────┴───────────────────┴───────────────────────┘
★ M13 = Principal fonte de receita (AdMob + Sponsored Listings)
⚠ M10 = Assinaturas — OPCIONAL, adiado (Post-MVP)
```

---

## TAREFA

Gere **um arquivo `.json` por módulo**, seguindo rigorosamente a estrutura do template abaixo.

---

## REGRAS OBRIGATÓRIAS

1. **Um arquivo por módulo**, nomeado conforme tabela de ordem de desenvolvimento.
2. **Cada módulo deve começar com `module_flow`**: BPMN textual completo com pools, lanes, gateways e message flows.
3. **Cada task deve conter**:
   - `use_cases[]`: casos de uso envolvidos
   - `functional_requirements[]`: com ID (RF-XX)
   - `business_rules[]`: com ID (RN-XX) — referenciar apenas as relevantes da lista acima
   - `user_stories[]`: "Como [ator], quero [ação] para [benefício]"
   - `bpmn_flow[]`: fluxo BPMN textual da task
   - `acceptance_criteria[]`: critérios verificáveis e objetivos
4. **Cada subtask deve conter**:
   - `use_case`: caso de uso relacionado
   - `functional_requirements[]`: específicos da subtask
   - `business_rules[]`: regras específicas
   - `user_story`: história do usuário
   - `bpmn_flow[]`: fluxo BPMN simplificado
   - `acceptance_criteria[]`: critérios verificáveis
   - `tech_notes`: orientações técnicas para **React Native/Expo + NestJS + Supabase/Prisma**
5. **Mínimo por módulo**: 4 tasks, cada uma com mínimo 3 subtasks.
6. **Respeite a stack**: tech_notes devem mencionar componentes específicos (FlashList, Expo Router, TanStack Query, Zustand, class-validator, Prisma, Supabase Auth, Socket.IO, BullMQ, etc.).
7. **Respeite RN03 e RN04 em todas as tasks** — nunca mencione preço como campo visível ou cadastro de peças avulsas.
8. **RN14 obrigatório em M05** — todo anúncio criado ou editado vai para fila de moderação.
9. **Status inicial de todos os itens:** `"planned"`.
10. **Prioridades:** `"P0"` (bloqueante), `"P1"` (alta), `"P2"` (média), `"P3"` (baixa).
11. Gere **JSON válido** — sem comentários inline, sem trailing commas.

---

## ESTRUTURA DO JSON — TEMPLATE COMPLETO

```json
{
  "module": {
    "id": "M01",
    "name": "Autenticação e Cadastro",
    "slug": "autenticacao_cadastro",
    "version": "1.0.0",
    "status": "planned",
    "priority": "P0",
    "epic_ref": "E01",
    "estimated_sprint": "Sprint 1",
    "tech_stack": {
      "mobile": "React Native + Expo SDK 51 + TypeScript + Expo Router",
      "backend": "Node.js + NestJS + TypeScript",
      "database": "Supabase (PostgreSQL) + Prisma ORM",
      "auth": "Supabase Auth + JWT custom + refresh token rotativo",
      "cache": "Redis via Upstash",
      "queue": "BullMQ",
      "email": "Resend / SendGrid",
      "push": "Expo Notifications + FCM + APNs",
      "storage": "Supabase Storage / S3/R2",
      "deploy": "Vercel (API) + Expo EAS (mobile)"
    },
    "description": "Módulo responsável por todo o ciclo de identidade do usuário: cadastro, autenticação, verificação, recuperação de senha e gestão de sessão. É a fundação de toda a plataforma — todos os módulos dependem deste.",
    "goals": [
      "Permitir cadastro seguro por e-mail/senha, Google, Apple e telefone (OTP)",
      "Garantir verificação de e-mail e telefone antes de permitir publicação",
      "Implementar sessão stateless com JWT + refresh token rotativo",
      "Registrar aceite de Termos, Política de Privacidade e LGPD"
    ],
    "actors": [
      "Comprador",
      "Vendedor",
      "Sistema de Autenticação (Supabase Auth)",
      "Serviço de E-mail (Resend)",
      "Serviço de SMS (OTP)"
    ],
    "dependencies": {
      "modules": [],
      "external_services": ["Supabase Auth", "Google OAuth 2.0", "Apple Sign-In", "SMS Gateway"]
    },
    "module_flow": {
      "description": "Fluxo completo de cadastro, verificação e autenticação no app mobile PECAÊ",
      "pools": [
        {
          "name": "Usuário",
          "lanes": ["Comprador / Vendedor"]
        },
        {
          "name": "App Mobile",
          "lanes": ["Expo Router / Telas React Native"]
        },
        {
          "name": "API NestJS",
          "lanes": ["AuthController", "AuthService", "UserService"]
        },
        {
          "name": "Serviços Externos",
          "lanes": ["Supabase Auth", "Resend (E-mail)", "SMS Gateway"]
        }
      ],
      "bpmn_text": [
        "START EVENT: Usuário abre o app pela primeira vez",
        "TASK (App): Exibir tela de onboarding / boas-vindas",
        "EXCLUSIVE GATEWAY: Usuário tem conta?",
        "  [Sim] --> TASK (App): Exibir tela de login",
        "  [Não] --> TASK (App): Exibir tela de cadastro",
        "TASK (Usuário): Escolher método: e-mail, Google, Apple ou telefone",
        "EXCLUSIVE GATEWAY: Método selecionado?",
        "  [E-mail] --> TASK (Usuário): Preencher nome, e-mail, senha, tipo de conta",
        "             TASK (API): Validar DTO → verificar duplicidade → hash senha → criar User (PENDING_VERIFICATION)",
        "             MESSAGE FLOW (Resend): Enviar e-mail de verificação com token",
        "             TASK (Usuário): Clicar no link → confirmar e-mail",
        "             TASK (API): Validar token → ativar conta (ACTIVE)",
        "  [Google]  --> TASK (App): Abrir Google OAuth 2.0",
        "             TASK (API): Validar token Google → criar/recuperar User",
        "  [Apple]   --> TASK (App): Abrir Apple Sign-In",
        "             TASK (API): Validar token Apple → criar/recuperar User",
        "  [Telefone]--> TASK (Usuário): Informar número",
        "             MESSAGE FLOW (SMS): Enviar OTP",
        "             TASK (Usuário): Digitar OTP",
        "             TASK (API): Validar OTP → criar/recuperar User",
        "TASK (Usuário): Aceitar Termos, Política de Privacidade e LGPD",
        "TASK (API): Registrar aceite com timestamp e IP",
        "TASK (API): Gerar access token (JWT 15min) + refresh token (7 dias)",
        "MESSAGE FLOW (App): Retornar tokens → armazenar com segurança",
        "TASK (App): Redirecionar para Home ou Onboarding de perfil",
        "END EVENT: Usuário autenticado e sessão ativa"
      ],
      "message_flows": [
        "API → Resend: Disparar e-mail de verificação com token único",
        "API → SMS Gateway: Enviar OTP de 6 dígitos",
        "API → App: Retornar access_token + refresh_token",
        "API → Resend: Disparar e-mail de redefinição de senha"
      ]
    },
    "functional_requirements": [
      {
        "id": "RF01",
        "description": "O sistema deve permitir cadastro de usuário com tipo: comprador, vendedor ou ambos",
        "priority": "P0"
      },
      {
        "id": "RF02",
        "description": "O sistema deve permitir autenticação por e-mail e senha",
        "priority": "P0"
      },
      {
        "id": "RF03",
        "description": "O sistema deve permitir autenticação via Google (OAuth 2.0)",
        "priority": "P0"
      },
      {
        "id": "RF04",
        "description": "O sistema deve permitir autenticação via Apple Sign-In",
        "priority": "P0"
      },
      {
        "id": "RF05",
        "description": "O sistema deve permitir autenticação via telefone com OTP por SMS",
        "priority": "P1"
      },
      {
        "id": "RF06",
        "description": "O sistema deve exigir verificação de e-mail antes de permitir publicação de anúncios",
        "priority": "P0"
      },
      {
        "id": "RF07",
        "description": "O sistema deve registrar aceite de Termos, Política de Privacidade e LGPD no cadastro",
        "priority": "P0"
      },
      {
        "id": "RF08",
        "description": "O sistema deve permitir recuperação de senha via link seguro por e-mail",
        "priority": "P0"
      }
    ],
    "business_rules": [
      {
        "id": "RN-M01-01",
        "description": "Um e-mail só pode estar associado a uma conta ativa no sistema"
      },
      {
        "id": "RN-M01-02",
        "description": "Token de verificação de e-mail expira em 24 horas; token de redefinição expira em 1 hora"
      },
      {
        "id": "RN-M01-03",
        "description": "Todo usuário recém-cadastrado inicia com status PENDING_VERIFICATION"
      },
      {
        "id": "RN-M01-04",
        "description": "Access token expira em 15 minutos; refresh token em 7 dias com rotation obrigatória"
      },
      {
        "id": "RN-M01-05",
        "description": "Apenas usuários com status ACTIVE podem publicar anúncios ou iniciar chats"
      }
    ],
    "use_cases": [
      {
        "id": "UC01",
        "name": "Cadastrar conta",
        "actors": ["Comprador", "Vendedor"],
        "preconditions": ["Usuário não possui conta com o e-mail informado"],
        "main_flow": [
          "1. Usuário acessa a tela de cadastro no app",
          "2. Seleciona método: e-mail, Google, Apple ou telefone",
          "3. Preenche dados obrigatórios",
          "4. Aceita Termos, Política e LGPD",
          "5. Sistema valida e cria conta (PENDING_VERIFICATION)",
          "6. Sistema envia verificação",
          "7. Usuário confirma",
          "8. Sistema ativa conta e autentica"
        ],
        "alternative_flows": [
          "A1. E-mail duplicado: informa e sugere login ou recuperação",
          "A2. Token expirado: oferece reenvio",
          "A3. OAuth falha: retorna para tela de cadastro com erro"
        ],
        "postconditions": ["Conta criada e ACTIVE", "Usuário autenticado com JWT + refresh token"]
      },
      {
        "id": "UC02",
        "name": "Autenticar-se no sistema",
        "actors": ["Comprador", "Vendedor", "Administrador", "Moderador"],
        "preconditions": ["Usuário possui conta ACTIVE"],
        "main_flow": [
          "1. Usuário informa e-mail e senha (ou usa OAuth)",
          "2. Sistema valida credenciais",
          "3. Sistema gera access token + refresh token",
          "4. App armazena tokens e redireciona para Home"
        ],
        "alternative_flows": [
          "A1. Senha errada: retorna 401 sem especificar qual campo está errado",
          "A2. Conta PENDING: orienta verificação de e-mail",
          "A3. Conta SUSPENDED/BANNED: informa situação e canal de suporte"
        ],
        "postconditions": ["Sessão ativa; tokens válidos armazenados no app"]
      }
    ],
    "tasks": [
      {
        "id": "M01-T01",
        "title": "Setup de banco, schema Prisma e modelo de usuário",
        "status": "planned",
        "priority": "P0",
        "estimated_days": 2,
        "epic": "E01 — Gestão de Contas",
        "description": "Definir o schema Prisma completo para as entidades de identidade (User, RefreshToken, EmailVerificationToken, PasswordResetToken, OtpCode, TermsAcceptance), criar as migrations no Supabase e configurar o cliente Prisma no NestJS.",
        "user_stories": [
          "Como desenvolvedor, quero um schema de banco robusto e tipado para que todas as funcionalidades de identidade sejam construídas sobre uma base sólida",
          "Como sistema, quero armazenar usuários com papéis, status e histórico de verificações para garantir segurança e rastreabilidade"
        ],
        "use_cases": ["UC01", "UC02"],
        "functional_requirements": [
          { "id": "RF01", "description": "Suporte a múltiplos tipos de conta: BUYER, SELLER, BOTH, ADMIN, MODERATOR" },
          { "id": "RF06", "description": "Campo emailVerified para controle de verificação" },
          { "id": "RF07", "description": "Entidade TermsAcceptance para registrar aceite de termos com timestamp e IP" }
        ],
        "business_rules": [
          { "id": "RN-M01-01", "description": "E-mail com constraint UNIQUE no banco" },
          { "id": "RN-M01-03", "description": "Status inicial PENDING_VERIFICATION" }
        ],
        "bpmn_flow": [
          "START EVENT: Início do setup de infraestrutura de identidade",
          "TASK (Dev): Escrever schema.prisma — model User com todos os campos",
          "TASK (Dev): Escrever model RefreshToken, EmailVerificationToken, PasswordResetToken, OtpCode",
          "TASK (Dev): Escrever model TermsAcceptance com referência a User",
          "TASK (Dev): Adicionar enums UserType e UserStatus",
          "TASK (Dev): Adicionar índices em email, status, userId",
          "TASK (Dev): Executar prisma migrate dev no Supabase",
          "TASK (Dev): Configurar PrismaService no NestJS com injeção de dependência",
          "TASK (Dev): Validar migrations em ambiente de CI",
          "END EVENT: Schema e cliente Prisma prontos para uso"
        ],
        "acceptance_criteria": [
          "Migration executada com sucesso no Supabase (ambiente local e staging)",
          "Campo email com constraint UNIQUE e índice B-Tree",
          "Enum UserType: BUYER, SELLER, BOTH, ADMIN, MODERATOR",
          "Enum UserStatus: PENDING_VERIFICATION, ACTIVE, SUSPENDED, BANNED",
          "passwordHash nunca retornado em queries padrão (excluído via select explícito no Prisma)",
          "PrismaService disponível via DI em qualquer módulo NestJS",
          "Seed básico de usuário admin funcional para desenvolvimento"
        ],
        "subtasks": [
          {
            "id": "M01-T01-ST01",
            "title": "Escrever schema Prisma — entidades de identidade",
            "status": "planned",
            "priority": "P0",
            "estimated_hours": 4,
            "description": "Criar schema.prisma com: User (id UUID, name, email UNIQUE, passwordHash, type UserType, status UserStatus, emailVerified Boolean, emailVerifiedAt?, phoneVerified Boolean, phoneVerifiedAt?, phone?, avatar?, createdAt, updatedAt), RefreshToken (id, userId, tokenHash, expiresAt, revokedAt?, ip, userAgent, createdAt), EmailVerificationToken (id, userId, tokenHash, expiresAt, usedAt?), PasswordResetToken (id, userId, tokenHash, expiresAt, usedAt?), OtpCode (id, phone, code, expiresAt, attempts, usedAt?), TermsAcceptance (id, userId, version, acceptedAt, ip, userAgent).",
            "user_story": "Como desenvolvedor, quero entidades de identidade bem definidas no Prisma para que toda autenticação seja type-safe e segura",
            "use_case": "UC01",
            "functional_requirements": [
              { "id": "RF01", "description": "Suporte a UserType e UserStatus como enums" },
              { "id": "RF07", "description": "TermsAcceptance com versão, timestamp e IP" }
            ],
            "business_rules": [
              { "id": "RN-M01-01", "description": "email com @unique no Prisma" },
              { "id": "RN-M01-03", "description": "status default: PENDING_VERIFICATION" }
            ],
            "bpmn_flow": [
              "START EVENT: Início da escrita do schema",
              "TASK: Declarar enum UserType e UserStatus",
              "TASK: Escrever model User com todos os campos e relações",
              "TASK: Escrever models de tokens com relação userId → User",
              "TASK: Escrever TermsAcceptance com versão e timestamp",
              "TASK: Adicionar @@index([email]), @@index([status]) em User",
              "TASK: Executar npx prisma validate",
              "END EVENT: Schema válido e sem erros"
            ],
            "acceptance_criteria": [
              "npx prisma validate retorna sem erros",
              "email tem @unique no model User",
              "passwordHash tem @map('password_hash') para snake_case no banco",
              "Todos os campos de token têm expiresAt para controle de expiração",
              "OtpCode tem campo attempts para limitar tentativas",
              "TermsAcceptance tem campo version para versionamento de termos"
            ],
            "tech_notes": "Usar PostgreSQL UUID: `id String @id @default(uuid())`. Mapear campos camelCase para snake_case com @map e @@map. Declarar enums fora dos models. Usar `@db.Text` para tokenHash para armazenar hashes longos. Adicionar `cascade: 'onDelete'` nas relações de token → User (se User deletado, tokens deletados). Criar arquivo `prisma/seed.ts` com usuário admin de desenvolvimento."
          },
          {
            "id": "M01-T01-ST02",
            "title": "Executar migrations e configurar PrismaService no NestJS",
            "status": "planned",
            "priority": "P0",
            "estimated_hours": 3,
            "description": "Executar `prisma migrate dev` no Supabase (ambiente local e staging). Criar PrismaModule e PrismaService no NestJS como módulo global com lifecycle hooks OnModuleInit e OnModuleDestroy para gestão de conexões. Configurar DATABASE_URL via ConfigModule do NestJS apontando para Supabase connection string com pooling (PgBouncer).",
            "user_story": "Como sistema, quero que o Prisma esteja disponível em toda a aplicação NestJS para que qualquer serviço possa acessar o banco com segurança",
            "use_case": "UC01",
            "functional_requirements": [
              { "id": "RF01", "description": "Banco pronto para receber cadastros de usuários" }
            ],
            "business_rules": [
              { "id": "RN-M01-01", "description": "Banco com constraint de unicidade em email" }
            ],
            "bpmn_flow": [
              "START EVENT: Início da configuração do Prisma no NestJS",
              "TASK: Instalar @prisma/client e prisma como devDependency",
              "TASK: Configurar DATABASE_URL no .env com connection string do Supabase",
              "TASK: Executar npx prisma migrate dev --name init_identity",
              "TASK: Criar PrismaService implementando OnModuleInit e OnModuleDestroy",
              "TASK: Criar PrismaModule com isGlobal: true",
              "TASK: Importar PrismaModule em AppModule",
              "TASK: Testar conexão com query prisma.$queryRaw`SELECT 1`",
              "END EVENT: PrismaService disponível globalmente via DI"
            ],
            "acceptance_criteria": [
              "Migration 0001_init_identity aplicada com sucesso no Supabase",
              "PrismaService injetável em qualquer módulo NestJS",
              "Conexão com banco verificada no startup da aplicação",
              "DATABASE_URL usa connection pooling (Session ou Transaction mode do Supabase)",
              "Logs de query habilitados em desenvolvimento, desabilitados em produção"
            ],
            "tech_notes": "Supabase oferece duas connection strings: direta (porta 5432) e pooled via PgBouncer (porta 6543). Usar a pooled para a API NestJS em produção. Para migrations, usar a connection direta. Configurar no NestJS via ConfigModule: `DatabaseUrl: process.env.DATABASE_URL`. PrismaService: `async onModuleInit() { await this.$connect(); }` e `async onModuleDestroy() { await this.$disconnect(); }`. Marcar como `@Global()` no PrismaModule."
          },
          {
            "id": "M01-T01-ST03",
            "title": "Seed inicial — PartCategory (lista fixa de categorias de peças)",
            "status": "planned",
            "priority": "P0",
            "estimated_hours": 3,
            "description": "Criar seed com a lista fixa de categorias de peças do sistema (PartCategory) que os vendedores usarão para marcar quais peças estão disponíveis em cada veículo. Essa lista é gerenciada apenas por administradores. Exemplos: Motor, Câmbio, Suspensão Dianteira, Suspensão Traseira, Freios, Lataria, Vidros, Bancos e Estofamento, Painel e Elétrica, Rodas e Pneus, Direção, Arrefecimento, Ar-Condicionado, Escapamento, Capo e Para-choque. Criar também seed de usuário admin de desenvolvimento.",
            "user_story": "Como sistema, quero uma lista fixa de categorias de peças no banco para que vendedores possam marcar quais peças estão disponíveis no veículo sem precisar digitar texto livre",
            "use_case": "UC01",
            "functional_requirements": [
              { "id": "RF24", "description": "Sistema deve exibir lista fixa de categorias de peças ao vendedor" },
              { "id": "RF25", "description": "Vendedor marca quais categorias estão disponíveis no veículo" }
            ],
            "business_rules": [
              { "id": "RN03", "description": "Anúncio representa veículo completo; peças são marcadas via lista fixa, não cadastradas individualmente" }
            ],
            "bpmn_flow": [
              "START EVENT: Executar seed do banco",
              "TASK: Criar arquivo prisma/seed.ts",
              "TASK: Inserir registros de PartCategory com upsert (idempotente)",
              "TASK: Inserir usuário admin de desenvolvimento com senha segura",
              "TASK: Executar npx prisma db seed",
              "END EVENT: Dados de seed disponíveis no banco"
            ],
            "acceptance_criteria": [
              "Seed é idempotente — pode ser executado múltiplas vezes sem duplicar dados",
              "Lista de PartCategory contém mínimo 15 categorias cobrindo os principais grupos de peças",
              "Cada PartCategory tem: id (UUID), name, slug (kebab-case único), icon (nome do ícone)",
              "Usuário admin de seed tem e-mail e senha definidos via variável de ambiente",
              "Seed executado com sucesso em ambiente local e staging"
            ],
            "tech_notes": "Usar `prisma.partCategory.upsert({ where: { slug }, create: {...}, update: {} })` para idempotência. Executar seed via `npx prisma db seed` configurado no package.json: `\"prisma\": { \"seed\": \"ts-node prisma/seed.ts\" }`. Usar `ts-node` com `tsconfig-paths`. Senha do admin via `process.env.ADMIN_SEED_PASSWORD` — nunca hardcoded. Gerar hash com bcrypt no seed antes de inserir. Esta lista é referência chave para o M05 (Cadastro de Sucata)."
          }
        ]
      }
    ]
  }
}
```

---

## PADRÃO BPMN (notação a seguir em todos os bpmn_flow)

```
START EVENT: [nome do evento]
TASK ([Actor/Lane]): [nome da tarefa]
EXCLUSIVE GATEWAY: [pergunta binária]?
  [Sim] --> TASK: [próxima tarefa]
  [Não] --> TASK: [caminho alternativo]
PARALLEL GATEWAY: [split/join]
  --> TASK ([Lane]): [paralelo 1]
  --> TASK ([Lane]): [paralelo 2]
MESSAGE FLOW ([De] → [Para]): [conteúdo]
INTERMEDIATE EVENT (Timer): [nome, ex: Aguardar 24h]
INTERMEDIATE EVENT (Error): [nome do erro]
END EVENT: [nome do evento final]
```

---

## ORDEM DE DESENVOLVIMENTO E GERAÇÃO DOS ARQUIVOS

Gere na ordem abaixo — esta é a sequência real de desenvolvimento do projeto:

### Fase 1 — Fundação (Sprints 1-2)
| Arquivo | Módulo | Épico Ref |
|---------|--------|-----------|
| `M01_autenticacao_cadastro.json` | Autenticação e Cadastro | E01 |
| `M04_catalogo_automotivo.json` | Catálogo Automotivo (Marcas, Modelos, Versões, Anos, PartCategory) | E03 |
| `M03_perfil_vendedor.json` | Perfil do Vendedor | E02 |
| `M02_perfil_comprador.json` | Perfil do Comprador | E01 |

### Fase 2 — Core do Produto (Sprints 3-5)
| Arquivo | Módulo | Épico Ref |
|---------|--------|-----------|
| `M05_cadastro_sucata.json` | Cadastro de Sucata / Veículo Base | E04 |
| `M07_busca_descoberta.json` | Busca e Descoberta | E05 |
| `M08_gestao_anuncios.json` | Gestão de Anúncios do Vendedor | E04+E11 |

### Fase 3 — Comunicação (Sprints 6-7)
| Arquivo | Módulo | Épico Ref |
|---------|--------|-----------|
| `M06_chat_negociacao.json` | Chat e Negociação | E06 |
| `M_favoritos_alertas.json` | Favoritos e Alertas de Busca | E10 |
| `M11_notificacoes.json` | Notificações (in-app + push + e-mail) | E09 |

### Fase 4 — Operação, Confiança e Monetização (Sprints 8-10)
| Arquivo | Módulo | Épico Ref | Status |
|---------|--------|-----------|--------|
| `M09_painel_moderacao.json` | Moderação e Confiança | E07 | Ativo |
| `M12_analytics_dashboard.json` | Analytics e Dashboard | E08 | Ativo |
| `M13_anuncios_inapp.json` | **Anúncios e Publicidade In-App** | E13 | **Ativo — Principal fonte de receita** |
| `M10_gestao_assinaturas.json` | Gestão de Assinaturas | E09 | ⚠️ OPCIONAL — Adiado Post-MVP |

---

## DIRETRIZES TÉCNICAS POR MÓDULO

### M01 — Autenticação e Cadastro
- **Entidades:** User, RefreshToken, EmailVerificationToken, PasswordResetToken, OtpCode, TermsAcceptance
- **Endpoints NestJS:** POST /auth/register, POST /auth/login, POST /auth/logout, POST /auth/refresh, POST /auth/verify-email, POST /auth/resend-verification, POST /auth/forgot-password, POST /auth/reset-password, POST /auth/phone/send-otp, POST /auth/phone/verify-otp, POST /auth/google, POST /auth/apple
- **Telas Expo Router:** app/(auth)/login.tsx, app/(auth)/cadastro.tsx, app/(auth)/verificar-email.tsx, app/(auth)/esqueci-senha.tsx, app/(auth)/redefinir-senha.tsx
- **Guards NestJS:** JwtAuthGuard, RolesGuard, @Public() decorator
- **Foco:** segurança, LGPD, verificação obrigatória, OAuth nativo no Expo

### M04 — Catálogo Automotivo
- **Entidades:** VehicleBrand, VehicleModel, VehicleVersion, VehicleYear, PartCategory
- **Endpoints:** GET /catalog/brands, GET /catalog/brands/:id/models, GET /catalog/models/:id/versions, GET /catalog/versions/:id/years, GET /catalog/part-categories
- **Telas:** Não tem tela dedicada; exposto como seleção em cascata no formulário de cadastro de sucata
- **Admin:** CRUD via painel web de administração
- **Foco:** seed inicial com marcas/modelos mais comuns no Brasil (Fiat, VW, GM, Ford, Toyota, Honda, Hyundai, Renault, Chevrolet, Nissan, Jeep), cache agressivo no Redis (dados raramente mudam)

### M03 — Perfil do Vendedor
- **Entidades:** SellerProfile, SellerStats, SellerVerification
- **Endpoints:** GET /sellers/:id, PUT /sellers/me, POST /sellers/request-verification, GET /sellers/me/stats
- **Telas:** app/(seller)/perfil.tsx, app/(seller)/perfil-editar.tsx, app/vendedor/[id].tsx (pública)
- **Foco:** dados públicos do vendedor, selo de verificado, indicadores de qualidade (tempo de resposta, anúncios ativos), localização para busca por proximidade

### M02 — Perfil do Comprador
- **Entidades:** BuyerProfile
- **Endpoints:** GET /buyers/me, PUT /buyers/me
- **Telas:** app/(buyer)/perfil.tsx, app/(buyer)/favoritos.tsx, app/(buyer)/buscas-salvas.tsx, app/(buyer)/conversas.tsx
- **Foco:** dados pessoais, acesso a favoritos, buscas salvas, histórico de chats, preferências de notificação

### M05 — Cadastro de Sucata / Veículo
- **Entidades:** Vehicle, VehiclePhoto, Listing
- **Endpoints:** POST /vehicles, GET /vehicles/:id, PUT /vehicles/:id, DELETE /vehicles/:id, POST /vehicles/:id/photos (presigned URL), PUT /vehicles/:id/available-parts, PUT /vehicles/:id/status
- **Telas:** app/(seller)/novo-anuncio.tsx (wizard multi-step: marca → modelo → ano → versão → localização → peças → fotos → revisão), app/(seller)/anuncio/[id]/editar.tsx
- **Upload:** Presigned URL do Supabase Storage / S3 → app envia direto → API processa assincronamente via BullMQ
- **CRÍTICO RN14:** Todo anúncio criado ou editado tem status PENDING obrigatoriamente; moderador aprova antes de PUBLISHED
- **CRÍTICO RN03:** Anúncio é sempre de veículo completo. Lista de peças = checkboxes da lista fixa de PartCategory
- **CRÍTICO RN04:** Nenhum campo de preço. Negociação é exclusivamente via chat
- **Foco:** wizard UX para facilitar cadastro, upload eficiente de 4-10 fotos, seleção de peças disponíveis

### M07 — Busca e Descoberta
- **Entidades:** SavedSearch (leitura; escrita no M_favoritos)
- **Endpoints:** GET /search?brand=&model=&yearMin=&yearMax=&city=&state=&q=&page=&limit=, GET /search/suggestions?q=, GET /search/brands-models (para autocomplete cascata)
- **Telas:** app/(tabs)/busca.tsx (tela principal), app/resultados.tsx, app/anuncio/[id].tsx
- **UX:** Seleção em cascata (marca → modelo → ano) + campo de texto livre para nome da peça; FlashList para resultados; paginação cursor-based
- **CRÍTICO:** Busca retorna **veículos/sucatas**, não peças individuais — alinhado com RN03
- **Foco:** performance de busca, autocomplete com debounce 300ms, filtros por localização (cidade/estado), sugestão de busca salva quando sem resultados

### M06 — Chat e Negociação  
- **Entidades:** ChatRoom, ChatMessage
- **Tecnologia:** Socket.IO com Redis Adapter (Upstash) para escala horizontal
- **Endpoints REST:** POST /chat/rooms (criar ou recuperar por listingId+buyerId), GET /chat/rooms (listar minhas conversas), GET /chat/rooms/:id/messages (histórico paginado)
- **Eventos Socket.IO:** join_room, send_message, message_received, typing, stop_typing, read_receipt, room_status_change
- **Telas:** app/(tabs)/mensagens.tsx (lista de conversas), app/chat/[roomId].tsx
- **CRÍTICO RN11:** Não permitir abertura de chat em anúncios não-Published
- **CRÍTICO RN04:** Chat é o único canal de negociação de valores — não exibir preços em nenhum campo
- **Foco:** tempo real, contexto do anúncio sempre visível na conversa, indicadores de lida, denúncia de conversa, respostas rápidas para vendedor

### M08 — Gestão de Anúncios do Vendedor
- **Telas:** app/(seller)/(tabs)/anuncios.tsx, app/(seller)/anuncio/[id]/index.tsx, app/(seller)/anuncio/[id]/estatisticas.tsx
- **Endpoints:** GET /seller/listings, PUT /listings/:id/status (PAUSE/REACTIVATE/CLOSE/SOLD), GET /listings/:id/stats, POST /listings/:id/duplicate
- **Ação rápida de "Peças disponíveis":** PUT /vehicles/:id/available-parts (atualizar checkboxes após negociações)
- **Foco:** painel de anúncios com status visível, ação de marcar vendido em 2 cliques (RN03 da OB03), estatísticas básicas

### M_favoritos_alertas — Favoritos e Alertas
- **Entidades:** Favorite, SavedSearch, Alert
- **Endpoints:** POST/DELETE /favorites/:listingId, GET /favorites, POST /saved-searches, GET /saved-searches, DELETE /saved-searches/:id
- **Alerta:** job BullMQ rodando a cada novo anúncio Published que verifica SavedSearch compatíveis e cria Notification
- **RF58 crítico:** Comprador pode criar alerta por modelo de veículo específico mesmo quando busca retorna zero resultados

### M11 — Notificações
- **Entidades:** Notification, PushSubscription
- **Tecnologia:** Expo Notifications + FCM (Android) + APNs (iOS) + Resend (e-mail)
- **Endpoints:** GET /notifications (paginado), PUT /notifications/read-all, PUT /notifications/:id/read, GET /notifications/preferences, PUT /notifications/preferences, POST /notifications/push-token
- **Eventos notificados:** nova mensagem de chat, anúncio aprovado/reprovado, alerta de busca match, conta bloqueada
- **Foco:** push nativo Expo, preferências por canal (push/email/in-app), badge count no ícone do app

### M09 — Moderação e Confiança
- **Entidades:** Report, ModerationCase, AuditLog
- **Endpoints:** POST /reports, GET /moderation/queue, GET /moderation/cases/:id, PUT /moderation/cases/:id/decision, GET /moderation/listings/pending (fila de aprovação de anúncios)
- **Interface:** Dashboard web (não é tela do app mobile — é painel web para moderadores/admin)
- **CRÍTICO RN14:** Fila de aprovação de novos anúncios é funcionalidade central deste módulo
- **Foco:** fila de moderação por gravidade, aprovação/rejeição de anúncios, auditoria imutável, score de risco

### M10 — Gestão de Assinaturas (OPCIONAL — ADIADO Post-MVP)
- **Status:** DEFERRED — não faz parte do MVP
- **Motivo:** Modelo de monetização redefinido para publicidade in-app (M13). Vendedores não pagam assinatura.
- **Revisar somente se:** estratégia de negócio mudar para modelo freemium com vendedores pagantes.
- **Arquivo:** `M10_gestao_assinaturas.json` — documentado mas com `status: "deferred"` e `priority: "P3"`

### M13 — Anúncios e Publicidade In-App ⭐ PRINCIPAL FONTE DE RECEITA
- **Entidades:** AdCampaign, AdImpression, AdClick + flag `isSponsoredActive` no Listing
- **Dois tipos de ad:** (1) **AdMob Programático** — banners e intersticiais Google gerenciados automaticamente; (2) **Sponsored Listings** — anúncios diretos de desmanches com destaque na busca
- **Endpoints Admin:** POST /admin/campaigns, GET /admin/campaigns, PATCH /admin/campaigns/:id, GET /admin/campaigns/:id (com timeline)
- **Endpoints Públicos:** POST /ads/track/impression, POST /ads/track/click (fire-and-forget via BullMQ)
- **Integração M07:** SearchService injeta até 2 Sponsored Listings no topo dos resultados de busca com targeting por brandId, cidade e estado
- **AdMob SDK:** `react-native-google-mobile-ads` — BannerAd (320x50 rodapé) + InterstitialAd (capping 30min via AsyncStorage)
- **Compliance:** CMP/UMP SDK para consentimento LGPD antes de qualquer ad AdMob
- **Tracking:** assíncrono via BullMQ TrackingWorker — dedup por sessionId hash (sem PII)
- **Expiração:** BullMQ CampaignExpiryWorker (cron diário) desativa campanhas expiradas e remove flag isSponsoredActive
- **Regras críticas:** RN16 (sem preços em Sponsored), RN17 (badge obrigatório), RN18 (CMP AdMob), max 2 sponsored por página de busca
- **Foco:** monetização não-intrusiva, métricas de CTR/impressões por campanha, transparência publicitária

---

## PERSONAS (para user_stories dos atores)

| Ator | Perfil |
|------|--------|
| **Comprador** | Pessoa física que precisa de peça usada; pode não conhecer nome técnico da peça; tem medo de fraudes |
| **Vendedor** | Operador de desmanche (PJ) ou particular; múltiplos veículos; sem tempo para detalhar cada peça |
| **Moderador** | Membro interno que garante qualidade e combate fraude na plataforma |
| **Administrador** | Equipe interna que gerencia dados, usuários, catálogo e configurações do sistema |

---

## CHECKLIST DE QUALIDADE — verificar antes de finalizar cada arquivo

- [ ] `module_flow.bpmn_text` cobre o processo completo com pools, lanes e message flows
- [ ] Todos os atores do módulo estão listados em `actors`
- [ ] Dependências de outros módulos em `dependencies.modules`
- [ ] Mínimo 4 tasks por módulo, cada uma com mínimo 3 subtasks
- [ ] `tech_notes` menciona React Native/Expo + NestJS + Supabase/Prisma (stack correta)
- [ ] Nenhuma task menciona preço como campo visível (RN04)
- [ ] Nenhuma task menciona cadastro de peças avulsas (RN03)
- [ ] M05 respeita RN14 — aprovação mandatória por moderador
- [ ] IDs únicos: `M[nn]-T[nn]-ST[nn]`, `RF[nn]`, `RN-M[nn]-[nn]`, `UC[nn]`
- [ ] Status de todos os itens: `"planned"`
- [ ] JSON válido — sem comentários, sem trailing commas, sem campos faltando

---

## INSTRUÇÃO FINAL

Gere **um arquivo por vez**, começando por `M01_autenticacao_cadastro.json`. Aguarde confirmação antes de avançar para o próximo módulo.

Seja **extremamente detalhista**: cada subtask deve ter tech_notes com bibliotecas, métodos e padrões específicos da stack do PECAÊ (React Native + Expo + NestJS + Supabase + Prisma). O objetivo é que um desenvolvedor possa implementar cada subtask sem precisar de contexto adicional além do arquivo JSON.

Não simplifique nem resuma. Este é o documento de especificação técnica definitivo do produto.

