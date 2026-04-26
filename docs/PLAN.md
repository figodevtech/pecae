# README Documentation Plan (PECAÊ Monorepo) - V2

## Objetivo
Criar o **Manual Técnico Definitivo do Desenvolvedor** para o PECAÊ. Este `README.md` não será apenas um resumo, mas um guia operacional profundo que mapeia fluxos de dados, arquitetura de sistemas, persistência, cache, mensageria e fornece rotas claras de troubleshooting para manutenção e resolução de problemas futuros.

## Estrutura do Manual Técnico Super Detalhado

### 1. Visão Geral e Topologia do Sistema
- **Contexto de Negócio:** O que é o PECAÊ e seus objetivos ("The Digital Forge").
- **Topologia (Turborepo):** Visão geral da comunicação entre `apps/mobile` (Expo/React Native) e `apps/api` (NestJS).
- **Ambiente de Desenvolvimento vs Produção:** Uso do Docker e configuração de portas.

### 2. Infraestrutura e Persistência de Dados
- **PostgreSQL (Prisma ORM):** 
  - Mapa dos domínios principais (Sellers, Catalog, Ads, Moderation).
  - Como as migrações e seeds são gerenciados (script `db:migrate` e `entrypoint.sh`).
- **Redis (Camada de Cache):**
  - Estratégias de invalidação e TTL.
  - Como o `SearchService` gera cache determinístico (SHA256) baseado em filtros.
- **BullMQ (Gerenciamento de Filas e Processamento Assíncrono):**
  - Filas existentes (`listings`, `ads`).
  - Fluxo de retry e fallback em caso de falha de conexão com Redis.
- **Armazenamento de Arquivos:** Fluxo de upload seguro de imagens (Supabase/S3).

### 3. Anatomia dos Módulos (Deep Dive Técnico)
*Cada módulo incluirá:* Funcionalidade principal, tabelas impactadas, fluxo de ponta a ponta (Mobile -> API -> DB), dependências e pontos de falha.
- **M03 (Sellers & KYC):**
  - Transição de estados do perfil (`PENDING`, `VERIFIED`, `REJECTED`).
  - Regras de CASL para moderadores verificando documentos.
- **M04/M05 (Catálogo, Veículos e Anúncios):**
  - Lifecycle de um veículo (Draft -> Publicado -> Vendido).
  - Tracking assíncrono de visualizações (Fila `listings` no BullMQ).
- **M13 (Publicidade e Monetização):**
  - Processadores `AdsProcessor` (impressões e cliques).
  - Cálculo de deduplicação (IP hash) para evitar fraude de cliques.
  - Atualização do balanço e limites de campanha.
- **Autenticação, Sessões e Segurança:**
  - Fluxos Multi-Provider (JWT, Google OAuth, OTP).
  - CASL `AbilityFactory` (Separação estrita de BUYER, SELLER, ADMIN, MODERATOR).
  - Segurança de API (Helmet, CORS, Rate Limiting).

### 4. Arquitetura Mobile (Apps/Mobile)
- **Gerenciamento de Estado (Zustand):**
  - Anatomia da `auth-store` e rotação silenciosa de JWT (Interceptors Axios).
  - Anatomia da `vehicle-wizard-store` (processo em múltiplas etapas de criação de anúncio).
- **Design System:** Diretrizes "The Digital Forge" (Glassmorphism, Nativewind).
- **Build & Nginx Proxy:** Como o Dockerfile converte o web-build para ser servido por Nginx.

### 5. Guia de Troubleshooting Avançado (Resolução de Problemas)
- **Cenário A: Dessincronização de Métricas/Cache (Search)**
  - Causa raiz e passo a passo de limpeza (uso de `/analytics/trigger-recalc`).
- **Cenário B: Jobs Travados ou Falhando no BullMQ (Ads/Views)**
  - Diagnóstico via logs e inspeção no Redis.
- **Cenário C: Mobile Preso na Tela Branca ou Sem Conexão (Network/Auth)**
  - Verificação de interceptors, loop infinito de refresh e `EXPO_PUBLIC_API_URL`.
- **Cenário D: Violação de Permissões (CASL)**
  - Como debugar testes de `Ability` falhando para moderadores ou sellers tentando modificar recursos de outros.

### 6. Contratos de Configuração (Environment Variables)
- Dicionário exaustivo de cada variável no `.env`, valores padrão esperados e seus impactos no código.

## Próximos Passos (Fase 2 de Orquestração)
Se aprovado, os agentes abaixo iniciarão a documentação técnica pesada:
1. **`backend-specialist`**: Modelagem de Dados, Filas, Redis, Segurança e Módulos Backend.
2. **`mobile-developer`**: Zustand, Mobile Arquitetura e Fluxos.
3. **`documentation-writer`**: Formatação profunda, Troubleshooting Guide e diagramação macro.

---
*Aguardando sua aprovação (Y/N) para executar o manual nesta profundidade tática e técnica.*
