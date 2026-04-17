# PECAÊ — Guia de Setup

## Pré-requisitos

- Node.js >= 20.x
- npm >= 10.x
- Conta no [Supabase](https://supabase.com) (banco de dados)
- Expo CLI: `npm install -g expo-cli`

---

## 1. Instalar dependências

Na raiz do monorepo:

```bash
npm install
```

---

## 2. Configurar variáveis de ambiente (API)

```bash
cp apps/api/.env.example apps/api/.env.local
```

Edite `apps/api/.env.local` e preencha:

| Variável | Como obter |
|----------|-----------|
| `DATABASE_URL` | Painel Supabase → Settings → Database → Connection String (Transaction pooler, porta 6543) |
| `DIRECT_URL` | Painel Supabase → Settings → Database → Connection String (Session pooler, porta 5432) |
| `JWT_SECRET` | Rode: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ADMIN_SEED_PASSWORD` | Define uma senha forte para o admin de dev |

> As variáveis de OAuth e e-mail (`RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, etc.) serão configuradas ao final do módulo M01.

---

## 3. Executar migrations no Supabase

```bash
cd apps/api
npm run db:migrate
```

Isso criará todas as tabelas definidas em `prisma/schema.prisma`.

---

## 4. Executar seed

```bash
npm run db:seed
```

Isso populará:
- 15 categorias de peças (`PartCategory`)
- Usuário admin de desenvolvimento

---

## 5. Rodar a API

```bash
npm run dev --filter=@pecae/api
# ou na raiz:
npm run dev
```

API disponível em: `http://localhost:3001/api/v1`  
Swagger docs: `http://localhost:3001/api/docs`

---

## 6. Rodar o app mobile

```bash
cd apps/mobile
npx expo start
```

---

## Estrutura do projeto

```
PECAÊ/
├── apps/
│   ├── api/                    ← NestJS API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   ← Schema do banco
│   │   │   └── seed.ts         ← Dados iniciais
│   │   └── src/
│   │       ├── prisma/         ← PrismaModule + PrismaService
│   │       ├── app.module.ts   ← Root module
│   │       └── main.ts         ← Entry point
│   └── mobile/                 ← Expo React Native
│       ├── app/                ← Expo Router screens
│       ├── app.json            ← Config Expo
│       └── babel.config.js
├── packages/
│   └── shared/                 ← Tipos e enums compartilhados
│       └── src/
│           ├── enums/          ← UserType, UserStatus, AuthProvider
│           └── types/          ← UserPublic, AuthTokens, ApiError
├── package.json                ← Workspace root
└── turbo.json                  ← Turborepo pipelines
```
