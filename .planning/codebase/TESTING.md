# Testes — PECAÊ

## 🧪 Estratégia
O projeto segue a pirâmide de testes:
1. **Testes Unitários**: Foco na lógica de negócio nos Services (NestJS) e Hooks/Stores (Mobile).
2. **Testes de Integração**: Foco nos endpoints da API e interações com o banco de dados (Prisma).
3. **Testes E2E**: Focados em fluxos críticos (Login, Cadastro de Sucata) usando Playwright (planejado).

## 🛠️ Ferramental
- **Backend**: [Jest](https://jestjs.io/) (configurado por módulo).
- **Mobile**: [Jest Expo](https://docs.expo.dev/develop/unit-testing/) + [React Native Testing Library](https://callstack.github.io/react-native-testing-library/).
- **Validação**: Validação de schema Prisma e testes de schema de DTO.

## 📈 Áreas de Cobertura
- **Auth**: 100% de cobertura na lógica de login/cadastro/refresh.
- **Veículos/Anúncios**: Testes unitários presentes em `vehicles.service.spec.ts`.
- **Componentes de UI**: Testes de snapshot e interação para `PecaeUI`.

## 🚀 Melhorias Futuras
- Implementar testes E2E com Playwright para o fluxo do `VehicleWizard`.
- Adicionar benchmarks de performance para o módulo de `Busca`.
