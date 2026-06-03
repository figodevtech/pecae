# M01 - Autenticação e Cadastro: Documentação de Implementação

## 1. Visão Geral do Módulo

O módulo M01 (Autenticação e Cadastro) constitui a fundação de toda a plataforma PECAÊ, sendo responsável por todo o ciclo de identidade do usuário: cadastro, autenticação, verificação, recuperação de senha e gestão de sessão. Este documento detalha a implementação completa do módulo, incluindo a arquitetura técnica, os requisitos funcionais, as regras de negócio, os casos de uso, os endpoints da API, o schema do banco de dados, as configurações de segurança e as integrações com serviços externos.

A versão atual do módulo é 1.0.0, com status "completed" e prioridade P0, indicando que todas as funcionalidades planejadas foram implementadas e testadas. O módulo foi desarrollado na Sprint 1 e possui uma dependência direta com a Epic E01 (Gestão de Contas).

### 1.1 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo SDK 51 + TypeScript + Expo Router |
| Backend | Node.js + NestJS + TypeScript |
| Database | Supabase (PostgreSQL) + Prisma ORM |
| Auth | Supabase Auth + JWT custom + refresh token rotativo |
| Cache | Redis via Upstash |
| Queue | BullMQ |
| Email | Resend / SendGrid |
| Push | Expo Notifications + FCM + APNs |
| Storage | Supabase Storage / S3/R2 |
| Deploy | Vercel (API) + Expo EAS (mobile) |

### 1.2 Descrição do Módulo

Módulo responsável por todo o ciclo de identidade do usuário: cadastro, autenticação, verificação, recuperação de senha e gestão de sessão. É a fundação de toda a plataforma — todos os módulos dependem deste.

### 1.3 Objetivos do Módulo

- Permitir cadastro seguro por e-mail/senha, Google, Apple e telefone (OTP)
- Garantir verificação de e-mail e telefone antes de permitir publicação
- Implementar sessão stateless com JWT + refresh token rotativo
- Registrar aceite de Termos, Política de Privacidade e LGPD

### 1.4 Atores

- Comprador
- Vendedor
- Sistema de Autenticação (Supabase Auth)
- Serviço de E-mail (Resend)
- Serviço de SMS (OTP)

### 1.5 Dependências Externas

- Supabase Auth
- Google OAuth 2.0
- Apple Sign-In
- SMS Gateway

---

## 2. Fluxo do Módulo

### 2.1 Fluxo BPMN (Texto)

```
START EVENT: Usuário abre o app pela primeira vez
TASK (App): Exibir tela de onboarding / boas-vindas
EXCLUSIVE GATEWAY: Usuário tem conta?
  [Sim] --> TASK (App): Exibir tela de login
  [Não] --> TASK (App): Exibir tela de cadastro
TASK (Usuário): Escolher método: e-mail, Google, Apple ou telefone
EXCLUSIVE GATEWAY: Método selecionado?
  [E-mail] --> TASK (Usuário): Preencher nome, e-mail, senha, tipo de conta
             TASK (API): Validar DTO → verificar duplicidade → hash senha → criar User (PENDING_VERIFICATION)
             MESSAGE FLOW (Resend): Enviar e-mail de verificação com token
             TASK (Usuário): Clicar no link → confirmar e-mail
             TASK (API): Validar token → ativar conta (ACTIVE)
  [Google]  --> TASK (App): Abrir Google OAuth 2.0
             TASK (API): Validar token Google → criar/recuperar User
  [Apple]   --> TASK (App): Abrir Apple Sign-In
             TASK (API): Validar token Apple → criar/recuperar User
  [Telefone]--> TASK (Usuário): Informar número
             MESSAGE FLOW (SMS): Enviar OTP
             TASK (Usuário): Digitar OTP
             TASK (API): Validar OTP → criar/recuperar User
TASK (Usuário): Aceitar Termos, Política de Privacidade e LGPD
TASK (API): Registrar aceite com timestamp e IP
TASK (API): Gerar access token (JWT 15min) + refresh token (7 dias)
MESSAGE FLOW (App): Retornar tokens → armazenar com segurança
TASK (App): Redirecionar para Home ou Onboarding de perfil
END EVENT: Usuário autenticado e sessão ativa
```

### 2.2 Fluxos de Mensagem

- API → Resend: Disparar e-mail de verificação com token único
- API → SMS Gateway: Enviar OTP de 6 dígitos
- API → App: Retornar access_token + refresh_token
- API → Resend: Disparar e-mail de redefinição de senha

---

## 3. Requisitos Funcionais

| ID | Descrição | Prioridade |
|----|----------|-----------|
| RF01 | O sistema deve permitir cadastro de usuário com tipo: comprador, vendedor ou ambos | P0 |
| RF02 | O sistema deve permitir autenticação por e-mail e senha | P0 |
| RF03 | O sistema deve permitir autenticação via Google (OAuth 2.0) | P0 |
| RF05 | O sistema deve permitir autenticação via telefone com OTP por SMS | P1 |
| RF06 | O sistema deve exigir verificação de e-mail antes de permitir publicação de anúncios | P0 |
| RF07 | O sistema deve registrar aceite de Termos, Política de Privacidade e LGPD no cadastro | P0 |
| RF08 | O sistema deve permitir recuperação de senha via link seguro por e-mail | P0 |

---

## 4. Regras de Negócio

| ID | Descrição |
|----|----------|
| RN-M01-01 | Um e-mail só pode estar associado a uma conta ativa no sistema |
| RN-M01-02 | Token de verificação de e-mail expira em 24 horas; token de redefinição expira em 1 hora |
| RN-M01-03 | Todo usuário recém-cadastrado inicia com status PENDING_VERIFICATION |
| RN-M01-04 | Access token expira em 15 minutos; refresh token em 7 dias com rotation obrigatória |
| RN-M01-05 | Apenas usuários com status ACTIVE podem publicar anúncios ou iniciar chats |

---

## 5. Casos de Uso

### 5.1 UC01 - Cadastrar Conta

**Atores:** Comprador, Vendedor

**Pré-condições:** Usuário não possui conta com o e-mail informado

**Fluxo Principal:**
1. Usuário acessa a tela de cadastro no app
2. Seleciona método: e-mail, Google, Apple ou telefone
3. Preenche dados obrigatórios
4. Aceita Termos, Política e LGPD
5. Sistema valida e cria conta (PENDING_VERIFICATION)
6. Sistema envia verificação
7. Usuário confirma
8. Sistema ativa conta e autentica

**Fluxos Alternativos:**
- A1. E-mail duplicado: informa e sugere login ou recuperação
- A2. Token expirado: oferece reenvio
- A3. OAuth falha: retorna para tela de cadastro com erro

**Pós-condições:** Conta criada e ACTIVE, Usuário autenticado com JWT + refresh token

---

### 5.2 UC02 - Autenticar-se no Sistema

**Atores:** Comprador, Vendedor, Administrador, Moderador

**Pré-condições:** Usuário possui conta ACTIVE

**Fluxo Principal:**
1. Usuário informa e-mail e senha (ou usa OAuth)
2. Sistema valida credenciais
3. Sistema gera access token + refresh token
4. App armazena tokens e redireciona para Home

**Fluxos Alternativos:**
- A1. Senha errada: retorna 401 sem especificar qual campo está errado
- A2. Conta PENDING: orienta verificação de e-mail
- A3. Conta SUSPENDED/BANNED: informa situação e canal de suporte

**Pós-condições:** Sessão ativa; tokens válidos armazenados no app

---

### 5.3 UC03 - Recuperar Senha

**Atores:** Comprador, Vendedor

**Pré-condições:** Usuário possui conta ACTIVE com e-mail verificado

**Fluxo Principal:**
1. Usuário acessa tela de esqueci-minha-senha
2. Informa e-mail cadastrado
3. Sistema valida existência e envia link de redefinição
4. Usuário clica no link (expira em 1h)
5. Define nova senha
6. Sistema invalida token e autentica

**Fluxos Alternativos:**
- A1. E-mail não encontrado: retorna mensagem genérica sem revelar existência
- A2. Token expirado: orienta solicitação de novo link

**Pós-condições:** Senha alterada com sucesso, Todos os refresh tokens anteriores invalidados

---

### 5.4 UC04 - Renovar Sessão com Refresh Token

**Atores:** Sistema (App)

**Pré-condições:** Usuário possui refresh token válido e não revogado

**Fluxo Principal:**
1. App detecta access token expirado
2. Envia refresh token ao endpoint /auth/refresh
3. API valida refresh token, revoga o atual e emite novo par de tokens
4. App armazena novos tokens

**Fluxos Alternativos:**
- A1. Refresh token inválido ou revogado: redireciona para login

**Pós-condições:** Nova sessão ativa com novo par de tokens

---

## 6. Tarefas e Subtarefas Implementadas

### 6.1 M01-T01: Setup de Banco, Schema Prisma e Modelo de Usuário

**Status:** completed | **Prioridade:** P0 | **Dias Estimados:** 2

**Descrição:** Definir o schema Prisma completo para as entidades de identidade (User, RefreshToken, EmailVerificationToken, PasswordResetToken, OtpCode, TermsAcceptance), criar as migrations no Supabase e configurar o cliente Prisma no NestJS.

**Subtarefas:**

#### M01-T01-ST01: Escrever Schema Prisma — Entidades de Identidade

**Status:** completed | **Horas Estimadas:** 4

Criar schema.prisma com: User (id UUID, name, email UNIQUE, passwordHash, type UserType, status UserStatus, emailVerified Boolean, emailVerifiedAt?, phoneVerified Boolean, phoneVerifiedAt?, phone?, avatar?, createdAt, updatedAt), RefreshToken (id, userId, tokenHash, expiresAt, revokedAt?, ip, userAgent, createdAt), EmailVerificationToken (id, userId, tokenHash, expiresAt, usedAt?), PasswordResetToken (id, userId, tokenHash, expiresAt, usedAt?), OtpCode (id, phone, code, expiresAt, attempts, usedAt?), TermsAcceptance (id, userId, version, acceptedAt, ip, userAgent).

**Critérios de Aceitação:**
- npx prisma validate retorna sem erros
- email tem @unique no model User
- passwordHash tem @map('password_hash') para snake_case no banco
- Todos os campos de token têm expiresAt para controle de expiração
- OtpCode tem campo attempts para limitar tentativas
- TermsAcceptance tem campo version para versionamento de termos

**Notas Técnicas:** Usar PostgreSQL UUID: `id String @id @default(uuid())`. Mapear campos camelCase para snake_case com @map e @@map. Declarar enums fora dos models. Usar `@db.Text` para tokenHash para armazenar hashes longos. Adicionar `cascade: 'onDelete'` nas relações de token → User (se User deletado, tokens deletados). Criar arquivo `prisma/seed.ts` com usuário admin de desenvolvimento.

#### M01-T01-ST02: Executar Migrations e Configurar PrismaService no NestJS

**Status:** completed | **Horas Estimadas:** 3

Executar `prisma migrate dev` no Supabase (ambiente local e staging). Criar PrismaModule e PrismaService no NestJS como módulo global com lifecycle hooks OnModuleInit e OnModuleDestroy para gestão de conexões. Configurar DATABASE_URL via ConfigModule do NestJS apontando para Supabase connection string com pooling (PgBouncer).

**Critérios de Aceitação:**
- Migration 0001_init_identity aplicada com sucesso no Supabase
- PrismaService injetável em qualquer módulo NestJS
- Conexão com banco verificada no startup da aplicação
- DATABASE_URL usa connection pooling (Session ou Transaction mode do Supabase)
- Logs de query habilitados em desenvolvimento, desabilitados em produção

**Notas Técnicas:** Supabase oferece duas connection strings: direta (porta 5432) e pooled via PgBouncer (porta 6543). Usar a pooled para a API NestJS em produção. Para migrations, usar a conexão direta. Configurar no NestJS via ConfigModule: `DatabaseUrl: process.env.DATABASE_URL`. PrismaService: `async onModuleInit() { await this.$connect(); }` e `async onModuleDestroy() { await this.$disconnect(); }`. Marcar como `@Global()` no PrismaModule.

#### M01-T01-ST03: Seed Inicial — PartCategory

**Status:** completed | **Horas Estimadas:** 3

Criar seed com a lista fixa de categorias de peças do sistema (PartCategory). Exemplos: Motor, Câmbio, Suspensão Dianteira, Suspensão Traseira, Freios, Lataria, Vidros, Bancos e Estofamento, Painel e Elétrica, Rodas e Pneus, Direção, Arrefecimento, Ar-Condicionado, Escapamento, Capo e Para-choque. Criar também seed de usuário admin de desenvolvimento.

**Critérios de Aceitação:**
- Seed é idempotente — pode ser executado múltiplas vezes sem duplicar dados
- Lista de PartCategory contém mínimo 15 categorias cobrindo os principais grupos de peças
- Cada PartCategory tem: id (UUID), name, slug (kebab-case único), icon (nome do ícone)
- Usuário admin de seed tem e-mail e senha definidos via variável de ambiente
- Seed executado com sucesso em ambiente local e staging

**Notas Técnicas:** Usar `prisma.partCategory.upsert({ where: { slug }, create: {...}, update: {} })` para idempotência. Executar seed via `npx prisma db seed` configurado no package.json: `"prisma": { "seed": "ts-node prisma/seed.ts" }`. Usar `ts-node` com `tsconfig-paths`. Senha do admin via `process.env.ADMIN_SEED_PASSWORD` — nunca hardcoded. Gerar hash com bcrypt no seed antes de inserir. Esta lista é referência chave para o M05 (Cadastro de Sucata).

---

### 6.2 M01-T02: Implementar Cadastro por E-mail/Senha e Verificação

**Status:** completed | **Prioridade:** P0 | **Dias Estimados:** 3

**Descrição:** Criar o fluxo completo de cadastro por e-mail e senha no NestJS (AuthController, AuthService, UserService) com validação de DTO via class-validator, hash de senha com bcrypt, criação de conta com status PENDING_VERIFICATION e envio de e-mail de verificação via Resend.

**Subtarefas:**

#### M01-T02-ST01: Criar RegisterDto, AuthController e AuthService (Cadastro E-mail)

**Status:** completed | **Horas Estimadas:** 5

Implementar RegisterDto com class-validator (IsEmail, IsString, MinLength(8), IsEnum(UserType), IsBoolean termsAccepted). Criar AuthController com @Post('register') e @Post('verify-email'). Criar AuthService.register() que verifica duplicidade, hash a senha com bcrypt, cria User e chama o serviço de e-mail.

**Critérios de Aceitação:**
- DTO rejeita e-mails inválidos, senhas < 8 chars e type fora do enum
- bcrypt usado com salt rounds 12
- prisma.user.create() executado dentro de transaction com termsAcceptance
- Retorno 201 com mensagem, sem dados sensíveis
- ConflictException retorna 409 com mensagem amigável (sem revelar e-mails existentes)

**Notas Técnicas:** NestJS: usar `@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`. Extrair IP via `@Req() req: Request` e `req.ip`. UserAgent via `req.headers['user-agent']`. Usar `@nestjs/config` para ConfigService. Instalar Pacotes: `class-validator`, `class-transformer`, `bcrypt`, `@types/bcrypt`. Usar `prisma.$transaction([...])` para garantir atomicidade do create User + TermsAcceptance.

#### M01-T02-ST02: Implementar Serviço de E-mail de Verificação via Resend

**Status:** completed | **Horas Estimadas:** 4

Criar MailModule e MailService no NestJS usando o SDK do Resend. Implementar método sendVerificationEmail(userId, email) que gera token seguro (crypto.randomBytes(32)), salva hash no EmailVerificationToken com expiresAt +24h e envia e-mail HTML com o link de verificação apontando para o deep link do app Expo.

**Critérios de Aceitação:**
- Token gerado com crypto.randomBytes (não Math.random)
- Somente o hash do token é salvo no banco (nunca o token raw)
- E-mail contém link válido com deep link do Expo
- expiresAt = Date.now() + 24 * 60 * 60 * 1000
- Falha no envio de e-mail não interrompe o cadastro (async fire-and-forget com log de erro)

**Notas Técnicas:** Instalar `resend` SDK. Configurar ResendModule com `RESEND_API_KEY` via ConfigService. Template HTML inline ou usar template engine como `@nestjs-modules/mailer` com Handlebars. Deep link Expo: configurar `scheme` no app.json do Expo e usar `Linking.createURL()` no app para gerar links universais. No NestJS, a URL base do deep link vem de variável de ambiente `EXPO_DEEP_LINK_BASE`. Endpoint de verificação: GET /auth/verify-email?token=. Para reenvio: POST /auth/resend-verification com body { email }.

#### M01-T02-ST03: Refatoração Visual & UX

**Status:** completed | **Horas Estimadas:** 6

Criar telas app/(auth)/cadastro.tsx e app/(auth)/verificar-email.tsx no Expo Router. Usar React Hook Form + Zod para validação local. Integrar com AuthService via TanStack Query (useMutation). Armazenar tokens no SecureStore. Implementar deep link handler para verificação de e-mail.

**Critérios de Aceitação:**
- Validação Zod impede submissão com campos inválidos
- Loading state no botão durante chamada à API
- Erros da API exibidos de forma clara e acessível
- Tokens JWT armazenados via expo-secure-store (nunca AsyncStorage para dados sensíveis)
- Deep link pecae://verify-email?token= capturado e processado corretamente
- Tela de verificação exibe timer de expiração (24h)

**Notas Técnicas:** Expo Router: `app/(auth)/cadastro.tsx` — o grupo (auth) usa layout sem tabs. React Hook Form: `useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })`. Zod schema: `z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), confirmPassword: z.string(), type: z.enum(['BUYER', 'SELLER', 'BOTH']), termsAccepted: z.literal(true) })`. TanStack Query: `useMutation({ mutationFn: authApi.register, onSuccess, onError })`. SecureStore: `await SecureStore.setItemAsync('access_token', token)`. Deep link: `Linking.addEventListener('url', handleDeepLink)` em useEffect.

---

### 6.3 M01-T03: Implementar Autenticação OAuth (Google) e Telefone (OTP)

**Status:** completed | **Prioridade:** P0 | **Dias Estimados:** 3

**Descrição:** Integrar Google Sign-In no app React Native via expo-auth-session. No NestJS, criar endpoint POST /auth/google que valida o idToken do Google, cria ou recupera o usuário (padrão BUYER) e emite JWT + refresh token.

**Subtarefas:**

#### M01-T03-ST01: Configurar Google OAuth no Expo e NestJS

**Status:** completed | **Horas Estimadas:** 5

Configurar expo-auth-session com Google provider no app React Native. No NestJS, implementar POST /auth/google que valida o idToken usando a lib google-auth-library e cria ou recupera o usuário no banco.

**Critérios de Aceitação:**
- expo-auth-session configurado com GOOGLE_CLIENT_ID via variável de ambiente
- Backend valida audience do token (evita token de outra aplicação)
- findOrCreate idempotente — chamadas múltiplas não duplicam usuário
- Usuário criado via Google não tem passwordHash (null)

**Notas Técnicas:** Instalar `expo-auth-session`, `expo-web-browser`. Para Google no Expo Go: usar proxy redirect. Para build: registrar scheme no Google Console. No NestJS: `npm i google-auth-library`. `const client = new OAuth2Client(GOOGLE_CLIENT_ID)`. `const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`. Para o Expo, usar scheme: `pecae://` e redirect: `redirectUri = makeRedirectUri({ scheme: 'pecae' })`. Criar campo `googleId String? @unique` no model User.

#### M01-T03-ST02: Removido - Apple Sign-In

**Status:** completed | **Prioridade:** P3 | **Horas Estimadas:** 0

Funcionalidade removida conforme decisão do usuário devido à ausência de conta Apple Developer.

**Critérios de Aceitação:**
- Nenhuma referência a Apple Sign-In no código final

#### M01-T03-ST03: Implementar Autenticação por Telefone com OTP

**Status:** completed | **Horas Estimadas:** 5

Criar fluxo de autenticação via número de telefone com OTP de 6 dígitos via SMS. Endpoints: POST /auth/phone/send-otp e POST /auth/phone/verify-otp. Usar Supabase Auth ou gateway SMS externo. Limitar tentativas de verificação (máx 3 por OtpCode).

**Critérios de Aceitação:**
- OTP gerado tem 6 dígitos numéricos
- Rate limit: máximo 1 envio por número por 60 segundos
- Após 3 tentativas erradas, OTP invalidado
- OTP expira em 10 minutos (expiresAt verificado no banco)
- SMS enviado com texto em português: 'Seu código PECAÊ: 123456'

**Notas Técnicas:** OTP gerado com: `Math.floor(100000 + Math.random() * 900000).toString()`. Salvar hash: `crypto.createHash('sha256').update(otp).digest('hex')`. Rate limit via Redis Upstash: `SET otp:ratelimit:{phone} 1 EX 60 NX`. SMS Gateway: Twilio, Infobip ou AWS SNS. Supabase Auth também oferece OTP por telefone nativamente se preferir delegar. No Expo: usar `react-native-otp-textinput` ou input manual com 6 campos. Configurar `autoFillFromSms` no iOS via `textContentType='oneTimeCode'`.

---

### 6.4 M01-T04: Implementar Login, Logout, Refresh Token e Recuperação de Senha

**Status:** completed | **Prioridade:** P0 | **Dias Estimados:** 2

**Descrição:** Implementar POST /auth/login (e-mail/senha), POST /auth/logout (revogação de refresh token), POST /auth/refresh (rotação de token), POST /auth/forgot-password e POST /auth/reset-password. Implementar JwtStrategy e JwtAuthGuard no NestJS. Criar tela de login no Expo.

**Subtarefas:**

#### M01-T04-ST01: Implementar POST /auth/login e JwtStrategy no NestJS

**Status:** completed | **Horas Estimadas:** 4

Criar endpoint POST /auth/login com LoginDto (email, password). Implementar AuthService.login() com bcrypt.compare. Configurar @nestjs/jwt com JwtModule.registerAsync usando ConfigService. Criar JwtStrategy (PassportStrategy) que extrai Bearer token e retorna payload. Criar JwtAuthGuard global com exceção via @Public() decorator.

**Critérios de Aceitação:**
- JWT assinado com HS256 e secret via ConfigService (JWT_SECRET)
- Payload JWT contém: sub (userId), type (UserType), iat, exp
- JwtAuthGuard aplicado globalmente; rotas públicas marcadas com @Public()
- @Req() user disponível em controladores protegidos
- Refresh token gerado com crypto.randomBytes(64).toString('hex')

**Notas Técnicas:** Instalar `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`. JwtStrategy extrai token do header `Authorization: Bearer <token>`. Criar decorator `@Public()` usando `SetMetadata('isPublic', true)`. JwtAuthGuard verifica metadata com Reflector. Payload: `{ sub: string, type: UserType }`. RefreshToken: salvar hash no banco, retornar raw token para o cliente. Usar `crypto.randomBytes(64).toString('hex')` para refresh token.

#### M01-T04-ST02: Implementar Refresh Token Rotation e Logout

**Status:** completed | **Horas Estimadas:** 3

Implementar POST /auth/refresh que recebe o refresh token, valida no banco (não expirado, não revogado), revoga o atual, gera novo par access + refresh e retorna. Implementar POST /auth/logout que revoga o refresh token (revokedAt = now()). No Expo, interceptar 401 com axios interceptor para chamar /refresh automaticamente.

**Critérios de Aceitação:**
- Refresh token usado uma única vez (rotation); uso duplicado invalida a sessão
- POST /auth/logout revoga o refresh token no banco
- App tem interceptor axios que detecta 401 e faz refresh automático
- Após logout, SecureStore limpo (deleteItemAsync)
- Rotation detecta reuso de token e invalida TODOS os tokens do usuário (reuse detection)

**Notas Técnicas:** Axios interceptor no Expo: `api.interceptors.response.use(null, async (error) => { if (error.response?.status === 401) { const newTokens = await authApi.refresh(storedRefreshToken); ... } })`. Prevenir refresh loop com flag `isRetry`. Reuse detection: se hash incoming token encontrado com revokedAt != null, considerar ataque de replay e revogar TODOS os RefreshTokens do usuário (`prisma.refreshToken.updateMany({ where: { userId }, data: { revokedAt: now() } })`). Zustand store para auth state: `useAuthStore` com `accessToken`, `refreshToken`, `user`, `setTokens`, `clearAuth`.

#### M01-T04-ST03: Implementar Recuperação e Redefinição de Senha

**Status:** completed | **Horas Estimadas:** 4

Criar POST /auth/forgot-password (envia e-mail com link de redefinição) e POST /auth/reset-password (valida token e altera senha). O link de redefinição usa deep link do Expo com token de 1 hora. Após reset, todos os refresh tokens anteriores s��o invalidados.

**Critérios de Aceitação:**
- POST /auth/forgot-password sempre retorna 200 (independente se e-mail existe)
- Token de redefinição expira exatamente em 1 hora
- Token só pode ser usado uma vez (usedAt verificado)
- Todos refresh tokens do usuário revogados após reset
- Nova senha validada com mínimo 8 caracteres no DTO

**Notas Técnicas:** Mesmo padrão de hash e armazenamento dos tokens de verificação: raw token retornado via e-mail, hash armazenado no banco. Deep link: `pecae://reset-password?token=<rawToken>`. Tela de redefinição captura o token via `useLocalSearchParams()` do Expo Router. Após reset bem-sucedido, `prisma.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } })` para revogar todos os tokens existentes.

---

## 7. Schema do Banco de Dados

### 7.1 Enums

```prisma
enum UserType {
  BUYER
  SELLER
  BOTH
  ADMIN
  MODERATOR
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  BANNED
}
```

### 7.2 Modelos

#### User
- id: String @id @default(uuid())
- email: String @unique
- passwordHash: String? @map("password_hash")
- name: String
- type: UserType
- status: UserStatus @default(PENDING_VERIFICATION)
- emailVerified: Boolean @default(false)
- emailVerifiedAt: DateTime?
- phoneVerified: Boolean @default(false)
- phoneVerifiedAt: DateTime?
- phone: String?
- avatar: String?
- googleId: String? @unique
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt

#### RefreshToken
- id: String @id @default(uuid())
- userId: String
- tokenHash: String @db.Text
- expiresAt: DateTime
- revokedAt: DateTime?
- ip: String
- userAgent: String?
- createdAt: DateTime @default(now())
- user: User @relation(fields: [userId], references: [id], onDelete: Cascade)

#### EmailVerificationToken
- id: String @id @default(uuid())
- userId: String
- tokenHash: String @db.Text
- expiresAt: DateTime
- usedAt: DateTime?
- createdAt: DateTime @default(now())
- user: User @relation(fields: [userId], references: [id], onDelete: Cascade)

#### PasswordResetToken
- id: String @id @default(uuid())
- userId: String
- tokenHash: String @db.Text
- expiresAt: DateTime
- usedAt: DateTime?
- createdAt: DateTime @default(now())
- user: User @relation(fields: [userId], references: [id], onDelete: Cascade)

#### OtpCode
- id: String @id @default(uuid())
- phone: String
- codeHash: String
- expiresAt: DateTime
- attempts: Int @default(0)
- usedAt: DateTime?
- createdAt: DateTime @default(now())

#### TermsAcceptance
- id: String @id @default(uuid())
- userId: String
- version: String
- acceptedAt: DateTime @default(now())
- ip: String
- userAgent: String?
- user: User @relation(fields: [userId], references: [id], onDelete: Cascade)

---

## 8. Endpoints da API

### 8.1 Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | /auth/register | Cadastro por e-mail/senha | Público |
| GET | /auth/verify-email | Verificação de e-mail | Público |
| POST | /auth/resend-verification | Reenviar verificação | Público |
| POST | /auth/login | Login por e-mail/senha | Público |
| POST | /auth/refresh | Renovar tokens | Público |
| POST | /auth/logout | Logout | Público |
| POST | /auth/google | Login via Google | Público |
| POST | /auth/phone/send-otp | Enviar OTP por SMS | Público |
| POST | /auth/phone/verify-otp | Verificar OTP | Público |
| POST | /auth/forgot-password | Solicitar recuperação | Público |
| POST | /auth/reset-password | Redefinir senha | Público |

---

## 9. Variáveis de Ambiente

### 9.1 Backend (NestJS)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| DATABASE_URL | Connection string do Supabase | Sim |
| JWT_SECRET | Segredo para assinatura JWT | Sim |
| JWT_EXPIRES_IN | Tempo de expiração do access token (padrão: 15m) | Sim |
| REFRESH_TOKEN_EXPIRES_DAYS | Dias de expiração do refresh token (padrão: 7) | Sim |
| RESEND_API_KEY | API key do Resend | Sim |
| EXPO_DEEP_LINK_BASE | URL base para deep links (ex: pecae://) | Sim |
| GOOGLE_CLIENT_ID | Client ID do Google OAuth | Sim |
| UPSTASH_REDIS_REST_URL | URL do Redis Upstash | Sim |
| UPSTASH_REDIS_REST_TOKEN | Token do Redis Upstash | Sim |

### 9.2 Frontend (Expo)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| EXPO_PUBLIC_API_URL | URL base da API | Sim |
| EXPO_PUBLIC_GOOGLE_CLIENT_ID | Client ID do Google para o app | Sim |

---

## 10. Estrutura de Arquivos

### 10.1 Backend (NestJS)

```
src/
├── prisma/
│   └── schema.prisma
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── decorators/
│   │   └── public.decorator.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── dto/
│       ├── register.dto.ts
│       ├── login.dto.ts
│       └──...
├── mail/
│   ├── mail.module.ts
│   └── mail.service.ts
└──...
```

### 10.2 Frontend (Expo)

```
app/
├── (auth)/
│   ├── _layout.tsx
│   ├── cadastro.tsx
│   ├── login.tsx
│   ├── verificar-email.tsx
│   ├── esqueci-senha.tsx
│   └── redefinir-senha.tsx
└──...
src/
├── api/
│   └── auth.ts
├── stores/
│   └── auth.store.ts
└── hooks/
    └── use-auth.ts
```

---

## 11. Configurações de Segurança

### 11.1 Hash de Senhas
- bcrypt com salt rounds 12
- passwordHash nunca retornado em queries padrão

### 11.2 Tokens JWT
- Algoritmo HS256
- Expiração: 15 minutos
- Payload: sub (userId), type (UserType)

### 11.3 Refresh Tokens
- Gerado com crypto.randomBytes(64)
- Hash SHA-256 salvo no banco
- Rotation obrigatória a cada uso
- Armazena IP e UserAgent

### 11.4 Proteção Contra Ataques
- Prevenção de enumeração de contas
- Rate limiting via Redis
- CORS configurado para origens autorizadas
- Reuse detection de refresh tokens