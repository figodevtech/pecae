# ARCHITECTURE.md

## Visão Geral da Arquitetura
O PECAÊ adota uma arquitetura distribuída através de um Monorepo gerenciado por Turborepo. Consiste em uma API central em NestJS e um aplicativo mobile React Native (Expo).

### Backend (NestJS)
- **Arquitetura Modular:** Padrão do NestJS dividindo o código em módulos (`Auth`, `Buyers`, `Sellers`, `Catalog`, `Vehicles/Listings`, `Search`, `Chat`, `Moderation`, `Analytics`, `Ads`).
- **Segurança:** 
  - CASL é utilizado pesadamente para Role-Based e Attribute-Based Access Control (RBAC/ABAC).
  - Prevenção de que Moderadores aprovem suas próprias lojas.
- **Processamento Assíncrono:**
  - `BullMQ` com Redis para processamento de filas (`listings` e `ads`).
  - Prevenção de locks concorrentes de banco de dados e controle de flood em views de produtos e clippings de campanhas patrocinadas.
- **Transações de Banco:** Prisma executa múltiplas inserções em bloco via Transactions (ex: Funil de criação de anúncio com links e peças atreladas).

### Frontend (Mobile)
- **State Management:** Uso tático de Zustand para funis e persistência complexa (como `auth-store` com Expo Secure Store).
- **Funil em Passos:** Múltiplas etapas de wizard para criação de anúncio segurando o tráfego HTTP até a confirmação final.
- **Interceptors:** O Axios é configurado para interceptação e tratamento inteligente de JWT Tokens expirados e loop de refreshes.

### Banco de Dados
- **PostgreSQL 16:** Integridade referencial pesada. Relacionamento complexo para Buyer -> Garagem, e Seller -> Verificação -> Anúncios.

### Comunicação Real-time
- **SSE (Server-Sent Events):** Utilizado para emissão unidirecional de dados no Chat (do servidor para o cliente), com REST sendo usado para enviar mensagens do cliente.
