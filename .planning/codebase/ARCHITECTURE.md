# Arquitetura — PECAÊ

## 🏗️ Design do Monorepo
O projeto segue uma estrutura de monorepo modular gerenciada pelo Turbo, separando o ambiente de execução (apps) da lógica compartilhada (packages).

### 📂 Layout do Workspace
- **`apps/api`**: Backend NestJS. Arquitetura modular onde cada domínio (auth, vehicles, chat) é um módulo independente.
- **`apps/mobile`**: App React Native/Expo. Utiliza Expo Router para navegação baseada em arquivos e uma camada centralizada de `src/hooks` e `src/services` para interação com a API.
- **`packages/shared`**: Tipos, interfaces e enums TypeScript compartilhados para garantir a segurança de tipos em toda a stack.

## 🔄 Fluxo de Dados
1. **Cliente-Servidor**: O app mobile se comunica com a API via REST.
2. **Tempo Real**: Socket.IO gerencia o chat contextualizado entre compradores e vendedores.
3. **Processamento Assíncrono**: BullMQ processa tarefas pesadas como processamento de fotos, envio de e-mails e disparo de notificações.
4. **Banco de Dados**: Prisma atua como a única fonte de verdade, com o Supabase fornecendo a instância PostgreSQL gerenciada.

## 🔐 Modelo de Segurança
- **Autenticação**: Baseada em JWT sem estado (stateless) com access tokens de curta duração (15m) e refresh tokens de longa duração (7d) armazenados no `SecureStore` (mobile).
- **Autorização**: Controle de Acesso Baseado em Funções (RBAC) via CASL na API para distinguir entre Compradores, Vendedores e Moderadores.
- **Privacidade de Dados**: Mascaramento de dados sensíveis como placas de veículos (RN08) e ausência de coleta de Chassi/VIN (RN05).
