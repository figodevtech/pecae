# Documentação de Implementação — M13: Anúncios e Publicidade In-App

## 📝 Visão Geral
O módulo **M13 (Anúncios e Publicidade In-App)** implementa a estratégia de monetização da plataforma PECAÊ. Ele combina anúncios programáticos externos (**Google AdMob**) com anúncios diretos patrocinados (**Sponsored Listings**) que permitem aos vendedores destacar suas sucatas no topo dos resultados de busca.

O módulo atua em duas frentes:
1. **Google AdMob SDK**: Exibição de Banners e Intersticiais com travamento de tempo (Frequency Capping).
2. **Sponsored Listings**: Injeção inteligente de anúncios de vendedores na busca do M07, com pacing uniforme.

---

## 🏗️ Arquitetura Técnica

### 1. Backend (NestJS + Prisma + BullMQ + Redis)
Focado em alta performance e baixa latência para rastreamento assíncrono:

*   **AdsModule**: Encapsula serviços de gestão de campanhas, capping e rastreamento.
*   **BullMQ Integration**: Registro "fire-and-forget" de `AdImpression` e `AdClick` para manter o tempo de resposta da API abaixo de 15ms.
*   **Redis Tracking**: Mecanismo de Frequency Capping persistente para evitar saturação de anúncios intersticiais.
*   **Targeting & Pacing**: Algoritmo que ordena campanhas ativas pelo menor número de impressões para garantir distribuição justa.

### 2. Mobile (React Native + Expo SecureStore + TanStack Query)
Desenvolvido com foco no design system **Industrial Glassmorphism**:

*   **Fallback Seguro**: Componentes de anúncio preparados para renderizar réplicas visuais de alta fidelidade em ambientes sem dependências nativas.
*   **Consent Management (CMP)**: Modal de consentimento LGPD persistido localmente via `SecureStore`.
*   **Painel Admin**: Telas de gestão de campanhas integradas na aba de moderação para criação e pausa em tempo real.

---

## 🗄️ Modelo de Dados (Prisma)

Modelos adicionados para persistência e métricas:

```prisma
model AdCampaign {
  id           String           @id @default(uuid())
  listingId    String           @unique
  budget       Float
  startDate    DateTime
  endDate      DateTime?
  status       AdCampaignStatus @default(ACTIVE)
  impressions  Int              @default(0)
  clicks       Int              @default(0)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  listing      Listing          @relation(fields: [listingId], references: [id])
}

model AdImpression {
  id         String   @id @default(uuid())
  campaignId String
  userId     String?
  ipHash     String
  createdAt  DateTime @default(now())
}

model AdClick {
  id         String   @id @default(uuid())
  campaignId String
  userId     String?
  ipHash     String
  createdAt  DateTime @default(now())
}

enum AdCampaignStatus {
  ACTIVE
  PAUSED
  CANCELLED
  EXPIRED
}
```

---

## ⚡ Fluxo de Anúncios e Capping

### 1. Impressões e Cliques:
1. O usuário visualiza o anúncio no Mobile.
2. O App dispara um `POST /api/v1/ads/track/impression`.
3. O Backend envia o evento para a fila do **BullMQ** e retorna `200 OK` instantaneamente.
4. O Worker processa o evento, incrementa o contador da campanha e salva o histórico no banco de dados.

### 2. Frequency Capping (Intersticiais):
* Antes de carregar um anúncio em tela cheia, o App consulta `GET /api/v1/ads/interstitial/status/:userId`.
* O Redis verifica se o usuário já viu anúncios nos últimos **30 minutos**.

---

## 🛡️ Regras de Negócio Implementadas

*   **Apenas Publicados**: Somente anúncios de sucatas com status `PUBLISHED` no M05 podem virar campanhas.
*   **Proteção Anti-Fraude**: Impressões limitadas a 1 por hora por `ipHash` (SHA-256) e Cliques limitados a 1 a cada 24 horas.
*   **Exclusão da Busca**: Anúncios patrocinados injetados no topo da busca são removidos dinamicamente do feed padrão para evitar duplicidade.

---

## 🛠️ Guia de Integração e Uso

### Como injetar Banners na Interface:
```tsx
import { AdBanner } from '../components/Ads/AdBanner';

// Em qualquer listagem ou topo de página
<AdBanner size="banner" />
```

### Endpoints Principais (Fronteira Admin):
*   `GET /api/v1/ads/campaigns`: Lista campanhas do sistema.
*   `POST /api/v1/ads/campaigns`: Cria nova campanha.
*   `PATCH /api/v1/ads/campaigns/:id/pause`: Pausa veiculação.

---
**Status da Implementação**: 🟢 Concluído
**Versão**: 1.0.0
**Data**: 26/04/2026
