# Plano de Trabalho: M07 — Busca e Descoberta

Este documento define o plano detalhado para o desenvolvimento e implementação do módulo M07, que integra o mecanismo de busca textual e em cascata para sucatas no PECAÊ.

---

## 🎯 Objetivos & Critérios de Sucesso
1. **Performance sub-200ms:** Implementação de Cache-Aside com Redis.
2. **Qualidade dos Dados:** Retornar exclusivamente sucatas completas (`PUBLISHED`).
3. **Filtros Avançados:** Filtro cascata (Marca → Modelo → Ano), localização e texto livre (FTS).

---

## 💻 Tipo de Projeto & Tech Stack
- **Tipo:** Full Stack (API NestJS + App Expo)
- **Tech Stack:**
  - Backend: NestJS + Prisma ORM + PostgreSQL
  - Mobile: React Native (Expo) + Expo Router
  - Cache: Redis via Upstash

---

## 📁 Arquivos Afetados / A Criar
### Backend:
- `apps/api/src/search/search.module.ts` (Novo)
- `apps/api/src/search/search.service.ts` (Novo)
- `apps/api/src/search/search.controller.ts` (Novo)
- `apps/api/src/search/dto/search-filters.dto.ts` (Novo)

### Mobile:
- `apps/mobile/app/(tabs)/busca.tsx` (Novo/Atualizar)
- `apps/mobile/app/resultados.tsx` (Novo)
- `apps/mobile/app/anuncio/[id].tsx` (Novo/Atualizar)

---

## 🛠️ Task Breakdown (Execução Individual)

### Fase 1: Backend (PostgreSQL FTS & Cache)
#### [x] M07-T01-ST01: SearchService — Filtros em Cascata
- **Agente:** `backend-specialist`
- **Ação:** Criar serviço de busca utilizando Prisma com filtros dinâmicos de marca, modelo, ano, localização e texto livre.
- **OUTPUT:** Método `search()` implementado com paginação cursor.

#### [x] M07-T01-ST02: Cache Redis (Look-aside)
- **Agente:** `backend-specialist`
- **Ação:** Integrar Redis para cachear queries de busca frequentes por 5 minutos.
- **OUTPUT:** TTL e chaves SHA256 aplicadas.

#### [x] M07-T01-ST03: Autocomplete Sugestões
- **Agente:** `backend-specialist`
- **Ação:** Endpoint de sugestões rápidas para Marca/Modelo.
- **OUTPUT:** `GET /search/suggestions`.

### Fase 2: Listing Detail (Anúncio)
#### [x] M07-T03-ST01: Endpoint de Detalhe Completo
- **Agente:** `backend-specialist`
- **Ação:** `GET /listings/:id` puxando Vehicle, Photos, Seller Mascarado.

---

## ⏸️ Aguardando Aprovação
