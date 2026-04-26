# M09 - Painel de Moderação: Documentação de Implementação

## 1. Visão Geral do Módulo

O módulo M09 (Painel de Moderação) é o mecanismo central de controle de qualidade, conformidade e segurança da plataforma PECAÊ. Ele garante que nenhum anúncio de peça ou desmanche seja publicado sem a aprovação explícita da equipe de administração e fornece o fluxo de "Selo Verificado" (KYC) para os perfis de vendedores. 

A versão atual do módulo é 1.0.0, com status "completed" e prioridade P1.

### 1.1 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo + TypeScript + TanStack Query |
| Backend | Node.js + NestJS + TypeScript + CASL |
| Database | Prisma ORM + PostgreSQL |

### 1.2 Descrição do Módulo

O painel é segmentado em regras estritas de acesso baseado em papéis (RBAC). Apenas usuários com roles `ADMIN` ou `MODERATOR` podem interagir com as filas de moderação, mitigando fraudes e anúncios fraudulentos no marketplace.

### 1.3 Objetivos do Módulo

- Permitir transações atômicas de aprovação e rejeição de anúncios.
- Fornecer fila FIFO para triagem eficiente de anúncios pendentes.
- Gerenciar aprovações KYC (upload de documentos dos vendedores).
- Fornecer interfaces visuais mobile robustas usando Industrial Glassmorphism.

---

## 2. Fluxo do Módulo

### 2.1 Fluxos de Moderação de Anúncios

```
[Vendedor] cria anúncio --> [API] Salva como PENDING_APPROVAL
                                  |
                                  v
[Moderador] visualiza fila FIFO (GET /moderation/listings)
                                  |
               +------------------+------------------+
               |                                     |
               v                                     v
       [AÇÃO] Aprovar                        [AÇÃO] Rejeitar
               |                                     |
               v                                     v
   Status atualizado para          Rejeição + Motivo Obrigatório
 ACTIVE (Side effects BullMQ)         Notificação via Mail/Push
```

---

## 3. Requisitos Funcionais

| ID | Descrição | Prioridade |
|----|----------|-----------|
| RF01 | O sistema deve listar anúncios pendentes em ordem cronológica (FIFO) | P0 |
| RF02 | O moderador deve poder aprovar anúncios tornando-os visíveis | P0 |
| RF03 | O moderador deve poder rejeitar anúncios enviando feedback descritivo | P0 |
| RF04 | O moderador deve ter acesso aos documentos de verificação KYC | P1 |

---

## 4. Regras de Negócio

| ID | Descrição |
|----|----------|
| RN-M09-01 | O moderador não pode aprovar um anúncio sem checagem manual |
| RN-M09-02 | Usuários básicos (BUYER/SELLER) não possuem acesso às rotas admin |
| RN-M09-03 | Rejeições de anúncios exigem obrigatoriamente um texto explicativo |

---

## 5. Casos de Uso

### 5.1 UC01 - Revisar Anúncios de Peças
O moderador entra na aba do painel, lê os detalhes do anúncio do veículo e aprova ou recusa com justificativa caso infrinja os termos de uso.

---

## 6. Tarefas Implementadas

### 6.1 RBAC com CASL no NestJS
Estruturação de políticas dinâmicas utilizando `@casl/ability`.

### 6.2 Moderação de Documentos e Selo KYC
Processamento de links seguros gerados de buckets privados do Supabase.

---

## 7. Endpoints da API

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/moderation/listings` | Lista fila de anúncios | Admin/Mod |
| POST | `/moderation/listings/:id/approve` | Aprova peça | Admin/Mod |
| POST | `/moderation/listings/:id/reject` | Rejeita peça | Admin/Mod |

---

## 8. Estrutura de Arquivos

### Backend
- `src/moderation/moderation.controller.ts`
- `src/moderation/moderation.service.ts`

### Mobile
- `app/(moderator)/_layout.tsx`
- `app/(moderator)/index.tsx`
- `app/(moderator)/documentos.tsx`
