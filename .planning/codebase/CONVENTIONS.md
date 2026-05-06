# Conventions — PECAÊ

## 📝 Coding Standards
- **Naming**:
    - **Files**: `kebab-case` for all files (e.g., `vehicle-wizard.tsx`).
    - **Classes**: `PascalCase` (e.g., `VehiclesService`).
    - **Variables/Functions**: `camelCase`.
    - **Database**: `snake_case` via Prisma `@map` and `@@map`.
- **Formatting**: Standard Prettier/ESLint rules enforced via monorepo root config.

## 🏗️ Design Patterns
- **NestJS**:
    - Controller-Service-Repository pattern (using Prisma as Repository).
    - DTO-based validation via `class-validator`.
    - CASL-based Authorization guards.
- **Mobile**:
    - **Atomic Components**: Reusable UI components in `components/PecaeUI`.
    - **Hook-based Logic**: Business logic encapsulated in custom hooks (`hooks/`).
    - **Store Pattern**: Zustand for global state (Auth, UI, Wizard).

## 📐 API Design
- **Endpoints**: Plural nouns (e.g., `/vehicles`, `/listings`).
- **Response Format**: Consistent JSON objects with error details for non-2xx codes.
- **Versioning**: Standardized in `docs-modules` as `v1.0.0`.
