# M03 - Perfil do Vendedor: Documentação de Implementação

## 1. Visão Geral do Módulo

O módulo M03 (Perfil do Vendedor) é responsável pela criação, edição e exibição do perfil público do vendedor (desmanche). Este documento detalha a implementação completa do módulo, incluindo a arquitetura técnica, os requisitos funcionais, as regras de negócio, os casos de uso, os endpoints da API, o schema do banco de dados, as configurações e as integrações com serviços externos.

A versão atual do módulo é 1.0.0, com status "in_progress" e prioridade P0, indicando que a implementação está em andamento. O módulo faz parte da Epic E02 (Perfis de Usuário) e foi planejado para a Sprint 2.

### 1.1 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo SDK 51 + TypeScript + Expo Router |
| Backend | Node.js + NestJS + TypeScript |
| Database | Supabase (PostgreSQL) + Prisma ORM |
| Storage | Supabase Storage (logo do vendedor) |
| Cache | Redis via Upstash |
| Queue | BullMQ |
| Deploy | Vercel (API) + Expo EAS (mobile) |

### 1.2 Descrição do Módulo

Módulo responsável pela criação, edição e exibição do perfil público do vendedor (desmanche). Inclui dados da loja (nome, tipo PF/PJ, endereço, horário, logo), processo de solicitação de verificação (Selo Verificado), e estatísticas de qualidade (tempo de resposta médio, anúncios ativos, avaliações).

### 1.3 Objetivos do Módulo

- Permitir que o vendedor crie e edite seu perfil de loja
- Exibir página pública do vendedor com todos os seus anúncios ativos
- Gerenciar processo de solicitação e concessão do Selo Verificado
- Calcular e exibir estatísticas de qualidade do vendedor

### 1.4 Atores

- Vendedor (PF ou PJ)
- Comprador (visualiza perfil público)
- Moderador (concede/revoga Selo Verificado)
- Sistema (calcula SellerStats)

### 1.5 Dependências do Módulo

- M01 (Autenticação e Cadastro) — dependência obrigatória
- M04 (Gestão de Anúncios) — dependência para listagens

---

## 2. Schema do Banco de Dados

### 2.1 Enum SellerType

```prisma
enum SellerType {
  PF  // Pessoa Física
  PJ  // Pessoa Jurídica
}
```

### 2.2 Enum VerificationStatus

```prisma
enum VerificationStatus {
  PENDING   // Em análise
  APPROVED  // Aprovado
  REJECTED  // Reprovado
}
```

### 2.3 Model SellerProfile

O modelo SellerProfile representa os dados da loja do vendedor.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| userId | String (UUID) @unique | Referência ao usuário (1:1) |
| storeName | String (100) | Nome da loja |
| type | SellerType (PF/PJ) | Tipo de vendedor |
| cnpj | String? (20) | CNPJ (apenas para PJ) |
| address | String (255) | Endereço completo |
| city | String (100) | Cidade |
| state | String (2) | Estado (UF) |
| lat | Float? | Latitude para geolocalização |
| lng | Float? | Longitude para geolocalização |
| whatsapp | String (20) | Número do WhatsApp |
| phone | String? (20) | Telefone fixo |
| openHours | Json? | Horários de funcionamento por dia |
| logo | Text? | URL do logo da loja |
| description | Text? | Descrição da loja |
| isVerified | Boolean @default(false) | Flag de Seller Verificado |
| showContactInfo | Boolean @default(false) | Exibir informações de contato (WhatsApp e Telefone) no perfil público |
| responseTimeAvg | Int? | Tempo médio de resposta (minutos) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |

**Índices:**
- `@@index([city, state])` - Para busca por localização
- `userId @unique` - Garante um perfil por usuário

**Relações:**
- User (1:1) - Proprietário do perfil
- SellerStats (1:1) - Estatísticas do vendedor
- SellerVerification (1:N) - Histórico de verificações
- Listing (1:N) - Anúncios do vendedor

### 2.4 Model SellerStats

O modelo SellerStats armazena as estatísticas calculadas do vendedor. Estas são atualizadas de forma assíncrona via BullMQ.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| sellerProfileId | String (UUID) @unique | Referência ao perfil (1:1) |
| activeListings | Int @default(0) | Número de anúncios ativos |
| totalListings | Int @default(0) | Total de anúncios já publicados |
| totalSold | Int @default(0) | Total de peças vendidas |
| avgResponseTimeMinutes | Int? | Tempo médio de resposta em minutos |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |

**Relações:**
- SellerProfile (1:1) - Perfil associado

### 2.5 Model SellerVerification

O modelo SellerVerification armazena o histórico de solicitações de verificação do Selo Verificado.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| sellerProfileId | String (UUID) | Referência ao perfil |
| status | VerificationStatus @default(PENDING) | Status atual |
| documentUrls | Json @default("[]") | Array de URLs dos documentos |
| notes | Text? | Observações (motivo da reprovação) |
| moderatorId | String? | ID do moderador que analisou |
| resolvedAt | DateTime? | Data da resolução |
| createdAt | DateTime | Data de criação |

**Relações:**
- SellerProfile (N:1) - Perfil verificado
- User (N:1) - Moderador que analisou

**Índices:**
- `@@index([sellerProfileId])` - Busca por perfil

---

## 3. Endpoints da API

### 3.1 Estrutura de Rotas

```
/api/sellers
├── POST /                       → Criar perfil de vendedor
├── PUT /me                      → Editar meu perfil
├── GET /me                     → Ver meu perfil
├── GET /me/stats               → Ver minhas estatísticas
├── POST /me/logo               → Gerar URL para upload de logo
├── POST /me/logo/confirm       → Confirmar upload de logo
├── GET /verification/status   → Ver status de verificação
├── POST /verification/request → Solicitar verificação
├── POST /verification/confirm  → Confirmar documentos de verificação
├── GET /:id                    → Ver perfil público
└── GET /:id/listings           → Ver anúncios do vendedor
```

### 3.2 Detalhamento dos Endpoints

#### POST /sellers — Criar Perfil

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Request Body:**

```typescript
{
  storeName: string;        // Mín. 3 caracteres
  type: 'PF' | 'PJ';       // Tipo de vendedor
  cnpj?: string;           // Obrigatório se PJ
  address: string;         // Endereço completo
  city: string;           // Cidade
  state: string;         // UF (2 caracteres)
  lat?: number;           // Latitude (opcional)
  lng?: number;          // Longitude (opcional)
  whatsapp: string;      // +5511999999999
  phone?: string;        // Telefone (opcional)
  showContactInfo?: boolean; // Exibir no perfil público
  openHours?: object;    // Json com horários por dia
  description?: string;  // Descrição da loja
}
```

- **Response (201):** Perfil criado
- **Erros:**
  - 409 Conflict: Usuário já tem perfil (use PUT /me)

#### PUT /sellers/me — Editar Perfil

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Request Body:** Partial de CreateSellerProfileDto
- **Response (200):** Perfil atualizado

#### GET /sellers/me — Ver Meu Perfil

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Response (200):** Perfil completo com estatísticas

#### GET /sellers/me/stats — Ver Estatísticas

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Response (200):** Objeto com activeListings, totalListings, totalSold, avgResponseTimeMinutes

#### POST /sellers/me/logo — Gerar URL de Upload

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Request Body:** `{ filename: string }`
- **Response (200):**

```typescript
{
  uploadUrl: string;   // URL para upload direto ao Storage
  token: string;       // Token de autenticação
  path: string;        // Path do arquivo no Storage
  publicUrl: string;  // URL pública após upload
}
```

#### POST /sellers/me/logo/confirm — Confirmar Upload

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Request Body:** `{ publicUrl: string }`
- **Response (200):** Perfil com logo atualizado

#### GET /sellers/verification/status — Ver Status de Verificação

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Response (200):**

```typescript
{
  isVerified: boolean;
  latestVerification: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    resolvedAt?: Date;
    notes?: string;
  } | null;
}
```

#### POST /sellers/verification/request — Solicitar Verificação

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Response (200):** Array de 5 URLs para upload de documentos

```typescript
[
  {
    id: 'doc_0',
    uploadUrl: string;
    token: string;
    path: string;
    publicUrl: string;
  },
  // ... até 5 documentos
]
```

#### POST /sellers/verification/confirm — Confirmar Verificação

- **Autenticação:** JWT obrigatória
- **Roles:** SELLER ou BOTH
- **Request Body:** `{ documentUrls: string[] }`
- **Response (201):** Solicitação criada com status PENDING
- **Erros:**
  - 409 Conflict: Já existe solicitação pendente

#### GET /sellers/:id — Perfil Público

- **Autenticação:** Não requerida (pública)
- **Response (200):** Dados públicos do vendedor

```typescript
{
  id: string;
  storeName: string;
  type: 'PF' | 'PJ';
  city: string;
  state: string;
  logo?: string;
  description?: string;
  isVerified: boolean;
  cnpj?: string;  // Formatado: XX.XXX.XXX/0001-**
  whatsapp?: string;   // Apenas se showContactInfo=true
  phone?: string;     // Apenas se showContactInfo=true
  stats: {
    activeListings: number;
    avgResponseTimeMinutes?: number;
  };
}
```

- **Erros:**
  - 404 Not Found: Vendedor não encontrado ou suspenso

#### GET /sellers/:id/listings — Anúncios do Vendedor

- **Autenticação:** Não requerida (pública)
- **Response (200):** Lista de anúncios com status PUBLISHED

---

## 4. DTOs e Validação

### 4.1 CreateSellerProfileDto

```typescript
export class CreateSellerProfileDto {
  @IsString()
  @MinLength(3, { message: 'storeName must be at least 3 characters long' })
  storeName: string;

  @IsEnum(SellerType)
  type: SellerType;

  @ValidateIf(o => o.type === SellerType.PJ)
  @IsString()
  cnpj?: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  lat?: number;

  @IsOptional()
  lng?: number;

  @Matches(/^\+55\d{10,11}$/, { message: 'WhatsApp deve estar no formato +5511999999999' })
  whatsapp: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  showContactInfo?: boolean;

  @IsOptional()
  @IsObject()
  openHours?: Record<string, string>;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

### 4.2 UpdateSellerProfileDto

```typescript
export class UpdateSellerProfileDto extends PartialType(CreateSellerProfileDto) {}
```

### 4.3 Regras de Validação

| Campo | Regra |
|-------|-------|
| storeName | Mínimo 3 caracteres |
| type | Apenas PF ou PJ |
| cnpj | Obrigatório se type=PJ, válido se PJ |
| whatsapp | Formato: +5511999999999 (10 ou 11 dígitos após +55) |
| state | 2 caracteres (UF) |
| openHours | Objeto JSON com formato `{ monday: '08:00-18:00', ... }` |

---

## 5. Processamento Assíncrono (BullMQ)

### 5.1 SellerStatsProcessor

Job responsável por calcular e atualizar as estatísticas do vendedor de forma assíncrona.

**Nome da Fila:** `seller-stats`

**Job:** `update-seller-stats`

**Dados do Job:**

```typescript
{
  sellerProfileId: string;
}
```

**Processo:**

1. Contar anúncios com status PUBLISHED (activeListings)
2. Contar anúncios com status SOLD (totalSold)
3. Contar total de anúncios (totalListings)
4. Calcular tempo médio de resposta (se disponível)
5. Atualizar SellerStats via Prisma

**Configurações de Retry:**

- maxAttempts: 3
- Backoff: Exponential (delay: 1000ms)

---

## 6. Regras de Negócio

### 6.1 RN-M03-01 — Um perfil por usuário

- Um usuário pode ter apenas um SellerProfile ativo
- Implementado via constraint `userId @unique` no Prisma
- API retorna 409 Conflict se tentar criar novamente

### 6.2 RN-M03-02 — Perfil suspenso

- Vendedor com status SUSPENDED ou BANNED tem perfil oculto
- GET /sellers/:id retorna 404
- Verificação em `findPublicProfile()` e `getSellerListings()`

### 6.3 RN-M03-03 — Stats assíncronos

- SellerStats são calculados via jobs BullMQ
- Não são calculados em tempo real
- Atualização dentro de 30 segundos do evento

### 6.4 RN-M03-04 — CNPJ mascarado

- CNPJ exibido parcialmente no perfil público: `XX.XXX.XXX/0001-**`
- Implementado em `findPublicProfile()`

### 6.5 RN13 — Selo Verificado

- Concedido exclusivamente pela moderação
- Após validação documental
- SellerProfile.isVerified atualizado via transaction

---

## 7. Integrações com Serviços Externos

### 7.1 Supabase Storage

#### Bucket: seller-logos (público)

- Armazena logos dos vendedores
- Acesso público para leitura
- Presigned URL para upload (5 min de expiração)

#### Bucket: verification-docs (privado)

- Armazena documentos de verificação
- Acesso restrito (apenas moderators via signed URL)
- Presigned URL para upload (5 min de expiração)

### 7.2 Integração com M11 (Notificações)

Quando a verificação é aprovada ou rejeitada, uma notificação é enviada ao vendedor:

```typescript
notificationService.send({
  userId: sellerId,
  type: 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED',
  content: 'Sua loja recebeu o Selo Verificado!' // ou motivo da reprovação
});
```

---

## 8. Fluxos de Implementação

### 8.1 Fluxo de Criação de Perfil

```
1. Vendedor acessa app/(seller)/perfil-criar.tsx
2. Preenche dados da loja no formulário
3. React Hook Form + Zod valida localmente
4. POST /sellers com CreateSellerProfileDto
5. SellerService.create():
   a. Verifica se usuário já tem perfil (unique constraint)
   b. Cria SellerProfile + SellerStats em transaction
6. Retorna perfil criado (201)
7. App exibe tela de perfil criado
8. redireciona para app/(seller)/perfil.tsx
```

### 8.2 Fluxo de Edição de Perfil

```
1. Vendedor acessa app/(seller)/perfil-editar.tsx
2. Dados atuais carregados via GET /sellers/me (useQuery)
3. Vendedor editar campos desejados
4. PUT /sellers/me com UpdateSellerProfileDto
5. SellerService.update() atualiza dados
6. App invalida cache (queryClient.invalidateQueries)
7. Exibe toast de sucesso
8. Retorna para tela de perfil
```

### 8.3 Fluxo de Solicitação de Verificação

```
1. Vendedor acessa app/(seller)/solicitar-verificacao.tsx
2. POST /sellers/verification/request
3. SellerService.requestVerification():
   a. Verifica se não há verificação PENDING
   b. Verifica se não é previamente verificado
   c. Gera 5 presigned URLs para Storage
4. App faz upload dos documentos
5. POST /sellers/verification/confirm com URLs
6. SellerService.confirmVerificationRequest():
   a. Cria SellerVerification com status PENDING
7. Moderador analisa via painel M09
8. Aprova/rejeita com atualização de isVerified
```

### 8.4 Fluxo de Upload de Logo

```
1. Vendedor seleciona imagem via expo-image-picker
2. POST /sellers/me/logo com { filename }
3. API gera presigned URL via Supabase Storage
4. App faz upload PUT para uploadUrl
5. POST /sellers/me/logo/confirm com { publicUrl }
6. API atualiza SellerProfile.logo
7. Cache invalidado
```

---

## 9. Telas do App (Expo Router)

### 9.1 Telas Planejadas

| Rota | Descrição | status |
|-----|-----------|--------|
| app/(seller)/perfil.tsx | Visão do próprio perfil | planned |
| app/(seller)/perfil-editar.tsx | Formulário de edição | planned |
| app/(seller)/perfil-criar.tsx | Onboarding de criação | planned |
| app/(seller)/solicitar-verificacao.tsx | Solicitação de verificação | planned |
| app/vendedor/[id].tsx | Perfil público do vendedor | planned |

---

## 10. Configurações de Segurança

### 10.1 Autenticação e Autorização

- Endpoints de escrita protegidos por JwtAuthGuard
- Verificação de Role: SELLER ou BOTH
- Rotas públicas: GET /sellers/:id, GET /sellers/:id/listings

### 10.2 Validação de Entrada

- DTOs com class-validator
- Zod schemas para validação no frontend
- Sanitização de dados sensíveis

### 10.3 Rate Limiting

- Aplicado via @nestjs/throttler
- POST endpoints: 100 req/min
- GET endpoints: 200 req/min

---

## 11. Testes e Qualidade

### 11.1 Testes Unitários

- SellerService.create() — criar perfil
- SellerService.update() — editar perfil
- SellerService.findPublicProfile() — dados públicos
- SellerStatsProcessor.handle() — cálculo de stats

### 11.2 Testes de Integração

- CRUD completo de perfil
- Upload de logo
- Fluxo de verificação
- Perfil público

### 11.3 Cobertura Esperada

- Mínimo 80% de cobertura nos serviços
- 100% nos endpoints de API

---

## 12. Configurações de Ambiente

### 12.1 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
SUPABASE_STORAGE_BUCKET_SELLER_LOGOS=seller-logos
SUPABASE_STORAGE_BUCKET_VERIFICATION_DOCS=verification-docs

# Redis (Upstash)
REDIS_URL=redis://...

# BullMQ
 BullMQ options for seller-stats queue
```

### 12.2 Índices de Banco

```sql
-- Busca por localização
CREATE INDEX seller_profiles_city_state_idx ON seller_profiles(city, state);

-- Lookup por usuário
CREATE UNIQUE INDEX seller_profiles_user_id_idx ON seller_profiles(user_id);

-- Histórico de verificações
CREATE INDEX seller_verifications_seller_profile_id_idx ON seller_verifications(seller_profile_id);
```

---

## 13. Checklist de Implementação

### 13.1 Concluído ✅

- [x] Schema Prisma: SellerProfile, SellerStats, SellerVerification
- [x] Migration de banco de dados
- [x] DTOs: CreateSellerProfileDto, UpdateSellerProfileDto
- [x] SellerService (CRUD básico)
- [x] SellerController (endpoints)
- [x] Upload de logo via Supabase Storage
- [x] Processo de solicitação de verificação
- [x] BullMQ: SellerStatsProcessor

### 13.2 Em Andamento 🔄

- [ ] Telas do app (Expo Router)
- [ ] Integração com M11 (notificações)

### 13.3 Pendente ⏳

- [ ] Tela de perfil próprio
- [ ] Tela de edição
- [ ] Tela de criação (onboarding)
- [ ] Tela de verificação
- [ ] Tela pública do vendedor
- [ ] Integração com listagens (M04/M05)

---

## 14. Referências

- **Especificação do Módulo:** `docs-modules/M03_perfil_vendedor.json`
- **Implementação API:** `apps/api/src/sellers/`
- **Schema Prisma:** `apps/api/prisma/schema.prisma`
- **Módulo Anterior:** M01 (Autenticação e Cadastro)
- **Módulo Dependente:** M04 (Gestão de Anúncios)

---

## 15. Histórico de Alterações

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0.0 | Sprint 2 | Versão inicialPlanejada |
| 1.0.0 | Sprint 3 | Implementação do schema Prisma |
| 1.0.0 | Sprint 3 | Implementação da API |