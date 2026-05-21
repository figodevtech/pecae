# TESTING.md

## Estratégia de Testes

### Backend
- **Testes Unitários:** Utilizamos `Jest` para testar os serviços e lógicas de negócios isoladas, realizando mocks em repositórios (Prisma) ou serviços externos.
- **Testes E2E (End-to-End):** Utilizados para testar as rotas da API em requisições de ciclo completo. O NestJS utiliza `Supertest` para testes nas pontas. O arquivo `test-runner.py` e os comandos base (`turbo run test`, `jest --config ./test/jest-e2e.json`) organizam a suíte de ponta a ponta.
- **Cobertura de Código:** Arquivos `.spec.ts` garantem a cobertura no script `test:cov`.

### Frontend
- **Testes de Integração e UI:** `Jest` combinado com `@testing-library/react-native` permite simulação da árvore DOM nativa (Testing Library). Renderização de UI é suportada por `react-test-renderer`.
- **E2E e Interações Globais:** Scripts externos como os do Playwright (se habilitados no repositório) focam na plataforma Web/E2E global, mas localmente os testes expo rodam com `jest-expo` e `jest --watchAll`.

### Automação de CI
- O script Turborepo `test` repassa execuções nos pacotes subjacentes. A checagem global se apoia em lints rigorosos do `@typescript-eslint` para garantir ausência de dívida técnica explícita.
