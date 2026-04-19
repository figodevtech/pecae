# PLANO DE IMPLEMENTAÇÃO: M01-T03 — OAuth (Google & Apple Sign-In)

## 🎼 Orchestration Context
- **Task:** Integrar autenticação OAuth com Google e Apple Sign-In no Expo Mobile e NestJS Backend.
- **Constraint:** Chaves de API ficam em variáveis de ambiente — implementação com stubs/placeholders prontos para configuração.
- **Agents:** `project-planner`, `backend-specialist`, `mobile-developer`, `security-auditor`

---

## 🔴 MOBILE DEVELOPER CHECKPOINT

```
Platform:   iOS + Android (Cross-platform)
Framework:  React Native + Expo SDK 51
State:      Zustand (useAuthStore já existente)
Security:   expo-secure-store (tokens sensíveis NUNCA em AsyncStorage)

3 Princípios:
1. Tokens Google/Apple nunca persistidos — apenas o JWT do backend é salvo
2. Apple Sign-In exibido APENAS em Platform.OS === 'ios'
3. expo-auth-session para Google (compatível com Expo Go e build standalone)

Anti-Patterns Evitados:
1. Hardcode de Client IDs — sempre via ENV
2. AsyncStorage para tokens — SecureStore obrigatório
```

---

## 📋 ESCOPO DA IMPLEMENTAÇÃO

### O que será feito:
- `apps/api` → Endpoints `/auth/google` e `/auth/apple` com validação de tokens
- `apps/mobile` → Botões integrados na tela de Login com fluxo OAuth completo
- `.env.example` → Todas as chaves documentadas e prontas para configuração
- Schema Prisma → Campos `googleId` e `appleId` adicionados ao model `User`

### O que NÃO será feito:
- Configuração de projetos no Google Cloud Console (requer chaves reais)
- Configuração de entitlements iOS no Xcode (requer conta Apple Developer)
- Testes E2E (OAuth requer redirecionamentos reais de browser)

---

## 🏗️ FASE 1: Schema & Backend (NestJS) [`@backend-specialist`]

### 1.1. Atualizar Schema Prisma
- [x] Adicionar campos `googleId String? @unique` no model `User`
- [x] Adicionar campo `appleId String? @unique` no model `User`
- [x] Executar `prisma migrate dev --name add_oauth_providers`

### 1.2. Instalar Dependências Backend
```bash
cd apps/api && npm install google-auth-library apple-signin-auth
```

### 1.3. Criar DTOs de OAuth
- [x] `apps/api/src/auth/dto/google-auth.dto.ts` → `{ idToken: string }`
- [x] `apps/api/src/auth/dto/apple-auth.dto.ts` → `{ identityToken: string, fullName?: string }`

### 1.4. Criar Estratégias de Validação (Services)
- [x] `AuthService.validateGoogleToken(idToken)` — usa `google-auth-library`
- [x] `AuthService.validateAppleToken(identityToken)` — usa `apple-signin-auth`
- [x] `UserService.findOrCreateOAuthUser({ email, name, googleId?, appleId? })`

### 1.5. Criar Endpoints no Controller
- [x] `POST /auth/google` → recebe `idToken`, valida, retorna JWT + refreshToken
- [x] `POST /auth/apple` → recebe `identityToken`, valida, retorna JWT + refreshToken

---

## 📱 FASE 2: Mobile (Expo) [`@mobile-developer`]

### 2.1. Instalar Dependências Mobile
```bash
cd apps/mobile && npx expo install expo-auth-session expo-web-browser expo-apple-authentication
```
> Nota: `expo-auth-session` e `expo-web-browser` já estão no SDK 51

### 2.2. Configurar app.json
- [x] Adicionar `scheme: "pecae"` para deep links OAuth
- [x] Criar arquivo `.env` com `EXPO_PUBLIC_GOOGLE_CLIENT_ID=AWAITING_KEY`

### 2.3. Criar Hooks OAuth
- [x] `apps/mobile/src/hooks/useGoogleAuth.ts` — encapsula `useAuthRequest` e `promptAsync`
- [x] `apps/mobile/src/hooks/useAppleAuth.ts` — encapsula `AppleAuthentication.signInAsync()`

### 2.4. Integrar na Tela de Login
- [x] Adicionar botão "Entrar com Google" com ícone e estética ForgeUI
- [x] Adicionar botão "Entrar com Apple" (visível APENAS em iOS)
- [x] Loading states individuais por botão
- [x] Tratamento de erro com mensagem amigável

---

## 🔐 FASE 3: Segurança [`@security-auditor`]

### 3.1. Validações Backend
- [x] **Google:** Verificar `audience` do token (evita tokens de outras apps)
- [x] **Apple:** Verificar `iss = https://appleid.apple.com` e `aud = bundle ID`
- [x] **findOrCreate:** Busca por `googleId OR email` para evitar duplicatas
- [x] **Apple "Hide Email":** Suporte a emails relay `@privaterelay.appleid.com`

### 3.2. Environment Variables (`.env.example`)
```dotenv
# OAuth — Google
GOOGLE_CLIENT_ID=AWAITING_KEY
GOOGLE_CLIENT_SECRET=AWAITING_KEY

# OAuth — Apple
APPLE_CLIENT_ID=AWAITING_KEY  # = bundle ID do app
APPLE_TEAM_ID=AWAITING_KEY
APPLE_KEY_ID=AWAITING_KEY
APPLE_PRIVATE_KEY=AWAITING_KEY  # Conteúdo do arquivo .p8

# Mobile (Expo Public)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=AWAITING_KEY
```

### 3.3. Pontos Críticos de Segurança
- [x] `GOOGLE_CLIENT_ID` jamais exposto no código — apenas em `ConfigService`
- [x] Token Apple validado com JWKS público da Apple (sem segredo necessário para verificação)
- [x] `fullName` em Apple salvo SOMENTE no primeiro login (Apple não reenvia)
- [x] Rate limit nos endpoints de OAuth (`@nestjs/throttler`) — 5 req/min via `APP_GUARD`

---

## ✅ CRITÉRIOS DE ACEITE

| Critério | Verificação |
|----------|-------------|
| Endpoint `/auth/google` aceita `idToken` e retorna JWT | Testável com token real |
| Endpoint `/auth/apple` aceita `identityToken` e retorna JWT | Testável em dispositivo iOS |
| Usuários OAuth têm `emailVerified=true` automaticamente | Via Prisma Studio |
| `findOrCreate` não duplica usuários | Chamadas múltiplas retornam mesmo usuário |
| Chaves em ENV, nunca hardcoded | `grep -r "GOAUTH"` retorna vazio |
| Botão Apple visível APENAS em iOS | `Platform.OS === 'ios'` verificado |
| SignIn com Google funciona no Expo Go via proxy | `makeRedirectUri({ useProxy: true })` |

---

## 🛠️ SCRIPTS DE VERIFICAÇÃO
```bash
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .
python .agent/skills/lint-and-validate/scripts/lint_runner.py .
```
