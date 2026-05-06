# Testing — PECAÊ

## 🧪 Strategy
The project follows the testing pyramid:
1. **Unit Tests**: Focus on business logic in Services (NestJS) and Hooks/Stores (Mobile).
2. **Integration Tests**: Focus on API endpoints and database interactions (Prisma).
3. **E2E Tests**: Focused on critical flows (Login, Scrap Registration) using Playwright (planned).

## 🛠️ Tooling
- **Backend**: [Jest](https://jestjs.io/) (configured per module).
- **Mobile**: [Jest Expo](https://docs.expo.dev/develop/unit-testing/) + [React Native Testing Library](https://callstack.github.io/react-native-testing-library/).
- **Validation**: Prisma schema validation and DTO schema testing.

## 📈 Coverage Areas
- **Auth**: 100% coverage on login/register/refresh logic.
- **Vehicles/Listings**: Unit tests present in `vehicles.service.spec.ts`.
- **UI Components**: Snapshot and interaction testing for `PecaeUI`.

## 🚀 Future Improvements
- Implement Playwright E2E tests for the `VehicleWizard` flow.
- Add performance benchmarks for the `Search` module.
