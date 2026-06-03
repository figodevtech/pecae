# Documentação de Implementação — M12: Analytics e Dashboard

## 📝 Visão Geral
O módulo **M12 (Analytics e Dashboard)** provê a camada de inteligência e métricas do sistema PECAÊ. Ele realiza a ingestão assíncrona de eventos de visualização de anúncios, rastreia a atividade diária de usuários (DAU), e consolida métricas agregadas para Vendedores e Administradores em dashboards dinâmicos.

Este módulo integra-se silenciosamente com os acessos via `JwtAuthGuard` para calcular a atividade diária sem onerar o banco de dados principal no fluxo de leitura.

---

## 🏗️ Arquitetura Técnica

### 1. Backend (NestJS + Prisma + BullMQ)
A implementação garante o princípio de **Event-Driven Asynchronous Processing** para evitar latência em requisições de clientes:

*   **AnalyticsModule**: Gerencia o ciclo de vida das filas e serviços de métricas.
*   **AnalyticsController**:
    *   `POST /analytics/listings/:id/view`: Rastreio público com dedup (24h via IP hash SHA256).
    *   `GET /analytics/seller/me`: Retorna o histórico de visualizações e conversão do vendedor.
    *   `GET /analytics/admin`: Retorna dados consolidados da saúde geral da plataforma.
*   **BullMQ Processor (`AnalyticsProcessor`)**: Executa as escritas pesadas e agrupamentos periódicos fora do fluxo da API principal.

---

## 🗄️ Modelo de Dados (Prisma)

As modificações estruturais no schema garantem armazenamento seguro e rápido:

```prisma
model User {
  // ...
  lastActiveAt DateTime?
}

model ListingView {
  id        String   @id @default(uuid())
  listingId String
  ipHash    String   // SHA256 do IP do usuário
  viewedAt  DateTime @default(now())

  @@unique([listingId, ipHash, viewedAt])
}

model ListingStats {
  id         String   @id @default(uuid())
  listingId  String   @unique
  totalViews Int      @default(0)
  totalChats Int      @default(0)
  updatedAt  DateTime @updatedAt
}
```

---

## 🔒 Segurança e Privacidade (Decisão Recomendada)
*   **Hashing de IP**: Em conformidade com a LGPD e privacidade, os IPs dos compradores não são guardados em texto claro. São salgados e processados utilizando criptografia SHA-256 no momento da escrita.

---

## 📱 Interface de Usuário (The Digital Forge)

Foram implementados dois dashboards mobile:
1.  **Dashboard do Vendedor (`perfil.tsx`)**:
    *   Cards de métricas instantâneas (Visualizações, Chats).
    *   Gráfico em barras customizado para Timeline de 7 dias.
    *   Guia incentivando o cadastro caso o histórico esteja zerado.
2.  **Dashboard do Administrador (`analytics.tsx`)**:
    *   Acompanhamento de DAU, novos usuários, e itens na fila de moderação pendente.

---

## ✅ Verificação e Testes

*   **Compilação**: Validada via TypeScript.
*   **Integridade**: A inclusão de dados estatísticos não afeta a visualização normal de listagens.

---

**Status da Implementação**: 🟢 Concluído
**Versão**: 1.0.0
**Data**: 26/04/2026
