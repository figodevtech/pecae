# Estrutura — Mapeamento de Módulos PECAÊ

## 📦 Implementação dos Módulos Core
Este documento mapeia os 14 módulos definidos em `docs-modules` para sua implementação atual na base de código.

| Módulo | Status | Localização API (`apps/api/src/`) | Localização Mobile (`apps/mobile/src/`) |
| :--- | :--- | :--- | :--- |
| **M01: Auth** | ✅ Completo | `auth/`, `users/` | `components/auth/`, `hooks/useGoogleAuth.ts` |
| **M02: Perfil Comprador** | ✅ Completo | `buyers/` | `hooks/useBuyer.ts`, `hooks/useFavorites.ts` |
| **M03: Perfil Vendedor** | ✅ Completo | `sellers/` | `hooks/useSellerDashboard.ts` |
| **M04: Catálogo** | ✅ Completo | `catalog/`, `vehicles/` | `components/Catalog/`, `hooks/useCatalog.ts` |
| **M05: Cad. Sucata** | ✅ Completo | `vehicles/`, `listings/` | `components/VehicleWizard/`, `store/vehicle-wizard-store.ts` |
| **M07: Busca** | ✅ Completo | `search/` | `hooks/useVehicles.ts` |
| **M08: Chat** | ✅ Completo | `chat/` | `hooks/useChat.ts`, `hooks/useNegotiations.ts` |
| **M09: Moderação** | ✅ Completo | `moderation/` | `hooks/useModeration.ts` |
| **M11: Notificações**| ✅ Completo | `notifications/`, `mail/`| `services/notification.service.ts` |
| **M12: Analytics** | ✅ Completo | `analytics/` | - |
| **M13: Anúncios In-App**| ✅ Completo | `ads/` | `components/Ads/`, `hooks/useAds.ts` |

## 📂 Arquivos Chave
- **Schema do Banco**: `apps/api/prisma/schema.prisma`
- **Requisitos do Produto (PRD)**: `v2_PRD-PECAE.md`
- **Definições de Módulos**: `docs-modules/*.json`
- **Tipos Compartilhados**: `packages/shared/src/index.ts`
