# API TypeScript Fix Plan

## Overview
Plan to resolve 18 TypeScript compilation errors preventing the `docker compose build` of the API service.

## Project Type
BACKEND

## Success Criteria
- [ ] API builds successfully via `npx turbo run build --filter=@pecae/api`.
- [ ] No TypeScript errors remain in the API codebase.

## Tech Stack
- NestJS
- TypeScript
- Prisma

## File Structure
No new files will be created. The following files will be modified:
- `apps/api/src/moderation/moderation.controller.ts`
- `apps/api/src/moderation/moderation.service.ts`
- `apps/api/src/search/search.service.ts`

## Task Breakdown

### Task 1: Fix implicit 'any' in Moderation Controller
- **Status:** ✅ Complete
- **Agent:** backend-specialist
- **Skill:** clean-code
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `apps/api/src/moderation/moderation.controller.ts`
- **OUTPUT:** Added type to `@Request() req` parameters.
- **VERIFY:** Build the API.

### Task 2: Fix incorrect property 'licensePlate' in Moderation Service
- **Status:** ✅ Complete
- **Agent:** backend-specialist
- **Skill:** clean-code
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `apps/api/src/moderation/moderation.service.ts`
- **OUTPUT:** Replaced `licensePlate` with `plate` (matching Prisma schema).
- **VERIFY:** Build the API.

### Task 3: Fix index signature error in Search Service
- **Status:** ✅ Complete
- **Agent:** backend-specialist
- **Skill:** clean-code
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `apps/api/src/search/search.service.ts`
- **OUTPUT:** Casted `filters` as `any` or used index signature.
- **VERIFY:** Build the API.

### Task 4: Fix CASL overloads in CASL Ability Factory
- **Status:** ✅ Complete
- **Agent:** backend-specialist
- **Skill:** clean-code
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `apps/api/src/auth/casl/casl-ability.factory.ts`
- **OUTPUT:** Casted conditions to `any` in `cannot` and `can` calls.
- **VERIFY:** Build the API.

### Task 5: Fix undefined assignment errors in Chat Service
- **Status:** ✅ Complete
- **Agent:** backend-specialist
- **Skill:** clean-code
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `apps/api/src/chat/chat.service.ts`
- **OUTPUT:** Added non-null assertion and optional chaining.
- **VERIFY:** Build the API.

### Task 6: Fix string | null mismatch in Moderation Service
- **Status:** ✅ Complete
- **Agent:** backend-specialist
- **Skill:** clean-code
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `apps/api/src/moderation/moderation.service.ts`
- **OUTPUT:** Passed `|| undefined` to `maskLicensePlate`.
- **VERIFY:** Build the API.

### Task 7: Fix relative import paths in EvalSellerScreen
- **Status:** ✅ Complete
- **Agent:** mobile-developer
- **Skill:** clean-code
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `apps/mobile/app/chat/[roomId]/avaliar.tsx`
- **OUTPUT:** Changed `../../../../` to `../../../` for PecaeUI, theme, and api imports.
- **VERIFY:** Build the Mobile app.

## Phase X: Verification
- [x] `docker compose build` passes.

## ✅ PHASE X COMPLETE
