# Concerns — Technical Audit & Errors

## 🔴 Critical Business Rule Violations (Must Fix)

### 1. Prohibited Price Field (RN04)
- **Issue**: The `Listing` model in Prisma and the `ListingsService` implementation still include a `price` field.
- **Violation**: **RN04** states: "A plataforma NÃO exibe preços em nenhum campo — negociação exclusivamente via chat".
- **Impact**: Inconsistent user experience and violation of the core specialized marketplace model.

### 2. Incorrect "Desmembramento" Logic (RN03)
- **Issue**: `VehiclesService.create` contains logic to create individual listings for each part marked as available.
- **Violation**: **RN03** states: "Anúncio representa SEMPRE um veículo completo NUNCA peças avulsas independentes".
- **Impact**: Catálogo pollution and violation of the vehicle-centric search model.

## 🟡 Technical Debt & Inconsistencies

### 3. Duplicate Service Logic
- **Issue**: Both `VehiclesService` and `ListingsService` have `create` and `update` methods with overlapping responsibilities.
- **Impact**: High maintenance cost and potential for state synchronization errors (e.g., moderation status not being reset in all flows).

### 4. Prisma Type Safety
- **Issue**: Extensive use of `as any` casts in `VehiclesService` and `ListingsService`.
- **Impact**: Loss of compile-time safety and increased risk of runtime crashes.

### 5. Mobile Routing Completeness
- **Issue**: While the `app/` directory exists, some wizard steps in `VehicleWizard` may not be fully integrated with the latest API changes (e.g., photo upload confirmation).

## 🟢 Implementation Gaps
- **Module M10 (Admin)**: Mostly backend-only currently; lacks a dedicated mobile/web admin interface beyond Swagger.
- **Search Refinement (M07)**: Geolocation filters in `VehiclesService` are basic and may need optimization for scale.
