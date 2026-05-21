# CONVENTIONS.md

## Padrões e Convenções

### Backend (NestJS)
- **Data Validation:** Utilizar extensivamente `@IsString()`, `@IsOptional()`, etc. providos pelo `class-validator` nas DTOs (Data Transfer Objects).
- **Controle de Acesso:** CASL é a ferramenta padrão. Modificações de Roles devem ter reflexo estrito na `CaslAbilityFactory`.
- **Background Jobs:** Tudo que é concorrente pesado, como incrementos transacionais repetitivos (Views, Clicks, etc.) DEVE ser delegado para uma Fila (Queue) no BullMQ (ex: `ListingsProcessor`, `AdsProcessor`).
- **Comunicação Cliente-Servidor Realtime:** Restringir WebSockets para interações vitais bidirecionais contínuas. Para feeds e chats transacionais baseados em mensagens assíncronas de baixo throughput de escrita e alto de leitura, priorizar SSE (Server-Sent Events) integrado ao fluxo REST normal da mensagem.

### Frontend (Mobile)
- **Gerenciamento de Estado:**
  - `Zustand` para fluxo contínuo ou stores de sessão. Não utilizar Context API para estados complexos propensos a mutação constante devido à performance de renderização no React Native.
  - Interceptors Globais do Axios devem capturar `401 Unauthorized` e garantir roteamento adequado para fora das áreas logadas (logout e renovação de token automatizada).
- **UI/UX e Glassmorphism:** Componentes e interface visual são geridos estritamente pelo padrão interno **The Digital Forge**, proibindo o uso arbitrário de layouts padronizados fora da biblioteca central de design (StyleQ, layouts blur/glassmorphism definidos).
- **Formulários:** Uso de `react-hook-form` associado a `zod` (`@hookform/resolvers`) para prevenir overhead de renderização na árvore de componentes.

### Testes
- TDD é recomendado, seguindo a pirâmide Unit -> Integration -> E2E.
- Padrão AAA (Arrange, Act, Assert).
