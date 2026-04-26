# Documentação de Implementação — M06: Avaliações e Reputação

## 📝 Visão Geral
O módulo **M06 (Avaliações e Reputação)** gerencia as interações pós-venda na plataforma PECAÊ. Ele permite que compradores avaliem vendedores com notas de 1 a 5 estrelas e comentários opcionais, processa essas notas de forma assíncrona em background para atualizar a reputação pública do vendedor e garante total conformidade com a LGPD por meio de anonimização.

---

## 🏗️ Arquitetura Técnica

### 1. Backend (NestJS + Prisma + BullMQ)
A arquitetura do backend priorizou segurança rígida, resiliência no processamento e respeito à privacidade de dados.

*   **ReviewsModule**: Centraliza o CRUD e regras de negócio para as avaliações.
*   **BullMQ (`SellerStatsProcessor`)**: Ao criar, alterar ou deletar uma avaliação, uma tarefa assíncrona em fila é disparada para recalcular a média ponderada e o total de avaliações, persistindo os resultados na tabela `SellerStats`.
*   **Validações**: Impede que compradores avaliem sem ter interagido via chat e bloqueia notas fora do intervalo [1..5].

### 2. Mobile (React Native + Expo + Reanimated)
A interface mobile foi desenvolvida com foco na estética **Industrial Glassmorphism** e feedback responsivo.

*   **StarRatingPicker**: Componente interativo que utiliza animações com efeitos de mola (`react-native-reanimated`) para uma sensação tátil premium.
*   **Tela de Avaliação (`app/chat/[roomId]/avaliar.tsx`)**: Integrada contextualmente dentro de cada negociação ativa.
*   **Exibição no Perfil (`app/vendedor/[id].tsx`)**: Adição da pontuação agregada no cabeçalho e listagem resumida dos depoimentos.

---

## 🗄️ Modelo de Dados (Prisma)

A entidade de avaliações foi acoplada ao ecossistema existente:

```prisma
model Review {
  id        String   @id @default(uuid())
  rating    Int      // 1 a 5 estrelas
  comment   String?  @db.Text
  isRemoved Boolean  @default(false)

  // Relacionamentos
  sellerId  String
  seller    Seller   @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  buyerId   String
  buyer     Buyer    @relation(fields: [buyerId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sellerId])
  @@index([buyerId])
}
```

---

## 🔒 Segurança e LGPD

Para resguardar as informações do usuário comprador:
*   O endpoint realiza o tratamento e mascaramento do nome do comprador diretamente na saída (`João M.`).
*   Restrição contra spoofing/avaliações forjadas via checagem de mensagens no chat.

---

## 🛠️ Guia de Uso

### Como enviar uma avaliação via API:
```bash
POST /sellers/:id/reviews
Authorization: Bearer <BUYER_TOKEN>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Peça idêntica ao anúncio, excelente vendedor!"
}
```

---
**Status da Implementação**: 🟢 Concluído
**Versão**: 1.0.0
**Data**: 25/04/2026
