# Structure — PECAÊ Module Mapping

## 📦 Core Modules Implementation
This document maps the 14 modules defined in `docs-modules` to their current implementation in the codebase.

| Module | Status | API Location (`apps/api/src/`) | Mobile Location (`apps/mobile/src/`) |
| :--- | :--- | :--- | :--- |
| **M01: Auth** | ✅ Complete | `auth/`, `users/` | `components/auth/`, `hooks/useGoogleAuth.ts` |
| **M02: Buyer Profile** | ✅ Complete | `buyers/` | `hooks/useBuyer.ts`, `hooks/useFavorites.ts` |
| **M03: Seller Profile** | ✅ Complete | `sellers/` | `hooks/useSellerDashboard.ts` |
| **M04: Catalog** | ✅ Complete | `catalog/`, `vehicles/` | `components/Catalog/`, `hooks/useCatalog.ts` |
| **M05: Scrap Reg.** | ⚠️ Incomplete | `vehicles/`, `listings/` | `components/VehicleWizard/`, `store/vehicle-wizard-store.ts` |
| **M07: Search** | ✅ Complete | `search/` | `hooks/useVehicles.ts` |
| **M08: Chat** | ✅ Complete | `chat/` | `hooks/useChat.ts`, `hooks/useNegotiations.ts` |
| **M09: Moderation** | ✅ Complete | `moderation/` | `hooks/useModeration.ts` |
| **M11: Notifications**| ✅ Complete | `notifications/`, `mail/`| `services/notification.service.ts` |
| **M12: Analytics** | ✅ Complete | `analytics/` | - |
| **M13: In-App Ads** | ✅ Complete | `ads/` | `components/Ads/`, `hooks/useAds.ts` |

## 📂 Key Files
- **Database Schema**: `apps/api/prisma/schema.prisma`
- **Product Requirements**: `v2_PRD-PECAE.md`
- **Module Definitions**: `docs-modules/*.json`
- **Shared Types**: `packages/shared/src/index.ts`
