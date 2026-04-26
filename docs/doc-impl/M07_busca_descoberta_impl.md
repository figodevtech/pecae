# Documentação de Implementação — M07: Busca e Descoberta

## 📝 Visão Geral
O módulo **M07 (Busca e Descoberta)** gerencia o mecanismo de busca textual e em cascata para sucatas no PECAÊ. Ele permite que os compradores encontrem peças e veículos rapidamente por meio de filtros dinâmicos, texto livre e sugestões inteligentes, garantindo alta performance com cache via Redis.

---

## 🏗️ Arquitetura Técnica

### 1. Backend (NestJS + Prisma + Redis + BullMQ)
A arquitetura do backend priorizou alta performance (sub-200ms), segurança dos dados e escalabilidade.

*   **SearchModule**: Centraliza os serviços de busca e sugestões.
    *   `SearchService.search()`: Filtros em cascata (Marca → Modelo → Versão → Ano), localização e texto livre via Prisma. Implementa paginação baseada em cursor.
    *   `SearchService.getSuggestions()`: Autocomplete dinâmico para Marcas e Modelos.
*   **Cache Look-aside (Redis)**: As consultas de busca são cacheadas com chaves determinísticas SHA256 baseadas nos filtros aplicados, com TTL de 5 minutos (300s).
*   **ListingsModule**: Gerencia o detalhe seguro de anúncios.
    *   `ListingsService.findOne()`: Retorna os dados completos do anúncio, omitindo dados sensíveis como a placa e o telefone do vendedor.
    *   **Incremento de Views (BullMQ + Redis Debounce)**: Registra visualizações de forma assíncrona, aplicando um bloqueio de 1 hora por IP para evitar spam de views.

---

## 🔒 Segurança e Regras de Negócio
*   **Blindagem de Dados**: O DTO de resposta do anúncio (`ListingDetailResponseDto`) remove explicitamente a placa do veículo e o telefone do vendedor.
*   **Apenas Publicados**: Tanto a busca quanto o detalhe retornam exclusivamente anúncios com status `PUBLISHED`.

---

## 🛠️ Guia de Uso / Endpoints

### 1. Buscar Anúncios
```bash
GET /search?q=motor&state=SP&limit=10
```

### 2. Sugestões de Busca (Autocomplete)
```bash
GET /search/suggestions?q=fiat
```

### 3. Detalhe do Anúncio
```bash
GET /listings/:id
```

---
**Status da Implementação**: 🟢 Concluído
**Versão**: 1.0.0
**Data**: 25/04/2026
