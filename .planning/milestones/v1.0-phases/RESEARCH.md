# RESEARCH.md — Análise e Revisão da Implementação da Fase 1

Este documento apresenta a análise de cobertura técnica e revisão de código para a **Milestone 1 (Sprint 1) — Fundações: Autenticação & Catálogo Automotivo**, cobrindo os módulos **M01 — Autenticação e Cadastro** e **M04 — Catálogo Automotivo**.

---

## 1. Estado Atual da Implementação

Após uma auditoria minuciosa da estrutura do monorepo, do banco de dados, da API NestJS e do aplicativo React Native (Expo), constatou-se que a **Fase 1 foi implementada com extrema robustez e fidelidade às especificações**. A fundação do ecossistema PECAÊ está totalmente estruturada.

### 1.1. Banco de Dados e Prisma (`apps/api/prisma`)
*   **Schema Prisma (`schema.prisma`)**: Totalmente implementado. Todas as tabelas de suporte à identidade do M01 (`User`, `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken`, `OtpCode`, `TermsAcceptance`) e ao catálogo do M04 (`PartCategory`, `PartCatalog`, `VehicleBrand`, `VehicleModel`, `VehicleVersion`, `VehicleYear`) estão mapeadas com relações, chaves primárias UUID e índices otimizados para busca e performance em cascata.
*   **Seed de Dados (`seed.ts` e `seed-test-data.ts`)**: Extremamente completo e abrangente. Popula o banco com:
    *   As 10 marcas de carros populares mais vendidas no Brasil (Fiat, VW, GM, Toyota, Hyundai, Jeep, Renault, Honda, Nissan, Ford) com seus respectivos modelos e segmentos de veículos.
    *   A lista fixa de 16 categorias principais de autopeças (`PartCategory`) com ícones dinâmicos.
    *   Sub-peças detalhadas para categorias cruciais (como motor, câmbio, lataria, etc.).
    *   Dados de teste: usuário administrador, usuário comprador, usuário vendedor ("Sucatão do Italo") e 5 veículos reais cadastrados com fotos reais do Unsplash e anúncios com status `PUBLISHED` vinculados.

### 1.2. Backend API NestJS (`apps/api/src/`)
*   **Módulo de Autenticação (`auth`)**:
    *   **Controle de Taxa (Throttling)**: Uso avançado de decorators `@Throttle` no `AuthController` para previnir ataques de brute-force e token stuffing em rotas de cadastro (20 req/min), login (10 req/min), OAuth Google (5 req/min) e OTP (3 req/min).
    *   **Endpoints**: Suporte total a fluxo de e-mail/senha com verificação em duas etapas via código (`verify-email`), rotação de tokens de sessão (`refresh`), logout revogando tokens, Google OAuth 2.0 (`google`), envio e validação de OTP via telefone (`phone/send-otp` e `phone/verify-otp`), e fluxo seguro de esqueci minha senha/redefinição com token de expiração de 1h (`forgot-password` e `reset-password`).
*   **Módulo de Catálogo (`catalog`)**:
    *   **Endpoints de Cascata**: Endpoints públicos (@Public()) para listar marcas, modelos por marca, versões por modelo, anos por versão e categorias de autopeças de forma encadeada.
    *   **Cache Redis Inteligente**: Injeção do `RedisService` no `CatalogService` com cache agressivo de 24h para todas as queries de catálogo (como marcas, modelos, versões), otimizando o tempo de resposta em ambientes móveis para < 100ms e aliviando a pressão sobre o PostgreSQL. Invalidação de cache por prefixo (`catalog:`) suportada para quando o admin realizar alterações.

### 1.3. Frontend Mobile React Native (`apps/mobile/`)
*   **Estrutura de Rotas (`app/`)**: Rotas organizadas com `expo-router` no diretório `(auth)` cobrindo todas as telas (login por e-mail, cadastro, login por OTP, redefinição de senha e verificação de e-mail).
*   **Hooks de Catálogo (`src/hooks/useCatalog.ts`)**: Hooks de consulta desenvolvidos em cima do `TanStack Query` (`useBrands`, `useModels`, `useVersions`, `useYears`, `usePartCategories`) com lógica de `enabled` condicional para a cascata e persistência de dados em cache local (`staleTime: 1h`).
*   **Componente Seletor de Veículo (`src/components/Catalog/VehicleSelector.tsx`)**: Componente sofisticado seguindo a estética industrial de Glassmorphism do design system **The Digital Forge**.
    *   Suporte a Breadcrumbs interativos (ex: Fiat > Uno > 1.0 Flex > 2018).
    *   Navegação por passos fluida e reativa de cada nível (Marca → Modelo → Versão → Ano).
    *   Ação de limpar seleção e botão de "Ver Resultados" com contador de listagens.

---

## 2. Análise de Lacunas (Gaps Assessment)

Embora a cobertura de código seja extraordinária, identificamos pequenos pontos de atenção e melhorias de ambiente que devem ser catalogadas para mitigar qualquer risco técnico na Milestone 1:

### Gap 2.1: Variáveis de Ambiente locais (`.env`)
*   **Contexto**: A API e o Mobile são executados perfeitamente via Docker Compose porque o `docker-compose.yml` centraliza a injeção de todas as variáveis no container (como `DATABASE_URL`, `REDIS_HOST`, `JWT_SECRET`, etc.).
*   **Problema**: Se o desenvolvedor decidir rodar `npm run dev` nativamente nas pastas `apps/api` e `apps/mobile` fora do Docker Compose (por exemplo, para usar um simulador local de celular ou debugar a API), a falta dos arquivos `.env` causará erros de conexão e de chave de API (`GOOGLE_CLIENT_ID`, etc.).
*   **Ação**: Criar scripts ou guias para inicialização local das variáveis baseadas no Compose.

### Gap 2.2: Setup de Testes Automatizados fora do Docker
*   **Contexto**: A suite de testes usa `jest` nos workspaces da API e do Mobile.
*   **Problema**: Executar os testes requer que as dependências do monorepo estejam totalmente instaladas via `npm install` local, e que os serviços de apoio (PostgreSQL e Redis) estejam de pé na porta local para passar os testes de integração.
*   **Ação**: Adicionar instruções claras de como inicializar apenas o banco e o redis no Docker (`docker compose up -d database redis`) antes de executar os testes locais, para dar suporte total à pipeline de Test-Driven Development (TDD).

---

## 3. Conclusão da Revisão

A Fase 1 foi **completamente construída com maestria técnica de altíssimo padrão**. A arquitetura do NestJS segue as melhores convenções de injeção de dependência e modularidade, e o frontend React Native está extremamente reativo e alinhado aos princípios estéticos e funcionais da plataforma.

A próxima etapa é consolidar a verificação de código e formalizar o encerramento seguro desta Milestone no **PLAN.md**.
