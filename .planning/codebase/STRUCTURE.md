# STRUCTURE.md

## Estrutura do Monorepo

O repositório é gerenciado através do Turborepo (definido em `turbo.json`), organizando as frentes no diretório de `apps/` e bibliotecas em `packages/`.

### Diretórios Principais
- `apps/`
  - `apps/api/` - API central desenvolvida em NestJS e Prisma.
  - `apps/mobile/` - Aplicativo frontend desenvolvido em React Native e Expo Router.
- `packages/`
  - `packages/shared/` - Tipagens e possivelmente utilitários compartilhados entre API e Mobile (identificado por `@pecae/shared` nas dependências).
- `scripts/` - Scripts auxiliares do repositório (ex: `patch-metro.js`, geradores ou seeds).
- `docs/` e `docs-modules/` - Documentação expandida.
- `.planning/` - Diretório reservado para dados e inteligência do sistema GSD / Antigravity.

### Estrutura Interna da API (`apps/api`)
- `src/` - Contém os controllers, services, guards, e modules (arquitetura padrão NestJS).
- `prisma/` - `schema.prisma`, arquivos de seed e migrations.
- `test/` - Configurações e setups para Jest End-to-End.

### Estrutura Interna Mobile (`apps/mobile`)
- Segue estrutura modular baseada em `expo-router` e diretório raiz focado nos fluxos das telas (`app/` ou estrutura equivalente de router).
