# Documentação de Implementação — M08: Chat e Negociação

Este documento consolida o relatório técnico da implementação do módulo de chat e negociação 1:1 local do PECAÊ.

---

## 🛠️ Modificações Realizadas

### 1. Modelagem do Banco de Dados (`schema.prisma`)
- Adicionadas as entidades:
  - `ChatRoom`: Salas de chat isoladas por par (Comprador + Anúncio).
  - `ChatMessage`: Mensagens textuais trocadas.
  - `ChatRead`: Controle de última leitura do usuário na sala.
- Constraints e índices configurados para desempenho.

### 2. Backend API (`apps/api/src/chat`)
- **DTOs**: `CreateRoomDto`, `SendMessageDto`.
- **Services**: Lógica para criação idempotente de salas, leitura de mensagens e filtragem de visualização apenas para os envolvidos (Comprador e Vendedor).
- **Tempo Real**: Implementação com suporte a SSE (Server-Sent Events) no backend.

### 3. Mobile UI (`apps/mobile`)
- **Aba Mensagens (`mensagens.tsx`)**: Listagem de chats ativos, badge com `unreadCount`.
- **Tela de Chat (`app/chat/[roomId].tsx`)**: Mensagens em formato de balão (estilo WhatsApp) com scroll automático.

---

## 🚀 Como testar localmente
1. Certifique-se de que o Postgres local esteja rodando.
2. Inicie a API e o aplicativo Expo.
3. Clique em "Entrar em contato" em qualquer anúncio para iniciar a conversa!
