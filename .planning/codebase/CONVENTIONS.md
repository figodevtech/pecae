# Convenções — PECAÊ

## 📝 Padrões de Código
- **Nomenclatura**:
    - **Arquivos**: `kebab-case` para todos os arquivos (ex: `vehicle-wizard.tsx`).
    - **Classes**: `PascalCase` (ex: `VehiclesService`).
    - **Variáveis/Funções**: `camelCase`.
    - **Banco de Dados**: `snake_case` via Prisma `@map` e `@@map`.
- **Formatação**: Regras padrão de Prettier/ESLint aplicadas via config na raiz do monorepo.

## 🏗️ Padrões de Design
- **NestJS**:
    - Padrão Controller-Service-Repository (usando Prisma como Repository).
    - Validação baseada em DTO via `class-validator`.
    - Guards de autorização baseados em CASL.
- **Mobile**:
    - **Componentes Atômicos**: Componentes de UI reutilizáveis em `components/PecaeUI`.
    - **Lógica Baseada em Hooks**: Lógica de negócio encapsulada em hooks customizados (`hooks/`).
    - **Padrão Store**: Zustand para estado global (Auth, UI, Wizard).

## 📐 Design de API
- **Endpoints**: Substantivos no plural (ex: `/vehicles`, `/listings`).
- **Formato de Resposta**: Objetos JSON consistentes com detalhes de erro para códigos não-2xx.
- **Versão**: Padronizada nos `docs-modules` como `v1.0.0`.
