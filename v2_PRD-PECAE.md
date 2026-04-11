# PRD — PECAÊ
## Documento de Requisitos do Produto (Product Requirements Document)

**Versão:** 1.0.0  
**Data:** Abril de 2026  
**Status:** Em elaboração  
**Stack:** React Native (Expo) + Node.js (NestJS/Fastify) + Supabase (PostgreSQL) + Redis + Socket.IO + S3/R2  
**Deploy:** Vercel (API) + Expo EAS (mobile)  

---

## Índice

1. [Sumário Executivo](#1-sumário-executivo)
2. [Visão do Produto](#2-visão-do-produto)
3. [Objetivos de Negócio](#3-objetivos-de-negócio)
4. [Perfis de Usuário (Personas)](#4-perfis-de-usuário-personas)
5. [Módulos do Sistema](#5-módulos-do-sistema)
6. [Fluxos Principais](#6-fluxos-principais)
7. [Casos de Uso](#7-casos-de-uso)
8. [Modelagem BPMN](#8-modelagem-bpmn)
9. [Diagramas de Atividade UML](#9-diagramas-de-atividade-uml)
10. [Requisitos Funcionais](#10-requisitos-funcionais)
11. [Requisitos Não Funcionais](#11-requisitos-não-funcionais)
12. [Regras de Negócio](#12-regras-de-negócio)
13. [Modelo de Domínio — Entidades](#13-modelo-de-domínio--entidades)
14. [Arquitetura Técnica](#14-arquitetura-técnica)
15. [Escalabilidade e Disponibilidade](#15-escalabilidade-e-disponibilidade)
16. [Estratégia de Implantação por Fase](#16-estratégia-de-implantação-por-fase)
17. [MVP — Escopo Mínimo Viável](#17-mvp--escopo-mínimo-viável)
18. [Backlog e Épicos](#18-backlog-e-épicos)
19. [Riscos e Mitigações](#19-riscos-e-mitigações)
20. [Glossário](#20-glossário)

---

## 1. Sumário Executivo

### 1.1 Descrição do Produto

O **PECAÊ** é uma plataforma **mobile** (React Native) de classificados para sucatas automotivas, inspirada no modelo operacional do OLX, mas especializada no mercado de desmanche. Vendedores cadastram veículos completos (sucatas), e compradores pesquisam por marca, modelo e ano para localizar sucatas disponíveis, analisar o estado de conservação, as peças disponíveis e negociar diretamente com o anunciante via chat integrado.

### 1.2 Proposta de Valor

| Para | Problema | Solução |
|------|----------|---------|
| **Compradores** | Dificuldade em encontrar peças usadas específicas de forma organizada e confiável | Busca por veículo, galeria de fotos e chat contextualizado com o vendedor |
| **Vendedores (desmanches)** | Pouca visibilidade e dificuldade em gerenciar estoque de peças | Painel de gestão de anúncios, estatísticas e contato qualificado com compradores |
| **Mercado** | Fragmentação e informalidade no mercado de peças usadas | Plataforma centralizada com moderação, padrão de qualidade e rastreabilidade |

### 1.3 Diferencial Competitivo

O diferencial central do PECAÊ está na **descoberta orientada por compatibilidade automotiva**: o comprador pesquisa um veículo e o sistema retorna veículos/sucatas. Isso inverte a lógica comum de classificados e oferece ao comprador uma experiência semelhante à de um catálogo de Sucatas e veículos para desmanche.

Adicionalmente:
- **Chat vinculado ao anúncio** preserva o contexto da negociação.
- **Perfil de vendedor verificado** reduz fraudes comuns no mercado de peças usadas.
- **Modelo de anúncio focado no veículo**: o vendedor cadastra a sucata completa e seleciona as peças disponíveis em uma lista fixa pré-definida. O comprador contata via chat para negociar valores e condições.

### 1.4 Escopo Geral

A plataforma **não processa pagamentos**. O escopo funcional concentra-se em:

1. Cadastro e publicação de anúncios de veículos
2. Alálise das publicações pelo sistema.
2. Busca e descoberta por compatibilidade. 
3. Comunicação comprador-vendedor via chat contextualizado.
4. Moderação, confiança e qualidade dos anúncios.
5. Administração da plataforma.

### 1.5 Restrições Fundamentais

- **Sem intermediação financeira:** a plataforma não processa, retém ou garante pagamentos.
- **LGPD:** tratamento de dados pessoais em conformidade com a Lei 13.709/2018.
- **Dados sensíveis:** placa exibida parcialmente mascarada quando informada. **Chassi não é campo do sistema** — sucatas frequentemente não possuem este dado e sua coleta não faz parte do modelo de negócio.

---

## 2. Visão do Produto

### 2.1 Conceito Central

```
Comprador seleciona Marca → Modelo → Ano no app → Sistema retorna sucatas disponíveis daquele modelo
→ Comprador analisa fotos e lista de peças disponíveis informadas pelo vendedor
→ Inicia chat com o vendedor → Negocia valores e logística diretamente (sem preços na plataforma).
```

### 2.2 Posicionamento de Mercado

| Categoria | Exemplos | Problema que eles têm |
|-----------|----------|-----------------------|
| Classificados gerais | OLX, Mercado Livre | Sem filtro de compatibilidade automotiva; experiência genérica |
| Buscadores especializados | B-Parts, BrasParts | Voltados a profissionais; UX complexa |
| WhatsApp/grupos informais | — | Sem organização, sem moderação, sem histórico |

O PECAÊ ocupa o espaço de **descoberta especializada com UX acessível** para o usuário comum.

## 3. Objetivos de Negócio

| # | Objetivo | Métrica de Sucesso |
|---|----------|--------------------|
| OB01 | Conectar compradores a peças disponíveis | Tempo médio até o primeiro contato < 3 minutos |
| OB02 | Reduzir fraudes e baixa qualidade | Taxa de denúncias procedentes < 5% dos anúncios ativos |
| OB03 | Facilitar gestão de estoque para desmanches | Atualização de disponibilidade em < 2 cliques |
| OB04 | Construir confiança na plataforma | NPS > 50 nas primeiras 500 avaliações |

**Roadmap Secundário:**
- Monetização via anúncios em destaque.
- Integração com ERP de desmanches.
- Publicação nas lojas App Store (iOS) e Google Play (Android).
- Reputação avançada com histórico verificado.

---

## 4. Perfis de Usuário (Personas)

### 4.1 Comprador

**Quem é:** Pessoa física que precisa de uma peça usada para reparo ou manutenção.

**Comportamento:** Pesquisa por nome da peça ou modelo do carro. Compara condição e localização. Pode não conhecer o nome técnico da peça.

**Dores:** Não sabe onde encontrar a peça; medo de comprar peça incompatível; receio de golpes.

**Ações:** Pesquisar, filtrar, favoritar, visualizar, iniciar chat, denunciar.

---

### 4.2 Vendedor (Desmanche / Pessoa Física)

**Quem é:** Operador de desmanche (PJ) ou particular que vende peças do próprio veículo sinistrado.

**Comportamento:** Tem múltiplos veículos para anunciar. Não tem tempo para descrever cada peça em detalhe. Responde compradores por WhatsApp, mas gostaria de centralizar.

**Dores:** Gerenciar estoque manualmente é difícil; perder contatos por falta de organização.

**Ações:** Cadastrar veículos, responder chat, atualizar disponibilidade, ver estatísticas.

---

### 4.3 Moderador / Administrador

**Quem é:** Membro da equipe interna responsável pela qualidade e integridade dos dados.

**Ações:** Revisar denúncias, moderar anúncios, bloquear usuários, gerenciar catálogo, emitir relatórios.

---

### 4.4 Suporte / Operação

**Quem é:** Atendente que lida com disputas e questões operacionais.

**Ações:** Resolver disputas, desbloquear contas, responder tickets.

---

## 5. Módulos do Sistema

O PECAÊ é composto por **12 módulos funcionais**:

```
┌─────────────────────────────────────────────────────────┐
│                     PECAÊ — MÓDULOS                     │
├──────────────────┬──────────────────┬───────────────────┤
│   ACESSO         │   CATÁLOGO       │   GESTÃO          │
│ M01 Auth         │ M04 Catálogo     │ M08 Gestão de     │
│ M02 Perfil       │     Automotivo   │     Anúncios      │
│     Comprador    │ M05 Cadastro de  │ M09 Moderação     │
│ M03 Perfil       │     Sucata/Veíc  │ M10 Administração │
│     Vendedor     │                  │ M12 Suporte e     │
│                  │                  │     Conteúdo      │
├──────────────────┴──────────────────┴───────────────────┤
│   DESCOBERTA     │   COMUNICAÇÃO    │   ENGAJAMENTO     │
│ M07 Busca e      │ Chat e           │ Favoritos/Alertas │
│     Descoberta   │ Negociação       │ M11 Notificações  │
└──────────────────┴──────────────────┴───────────────────┘
```

---

### M01 — Autenticação e Cadastro

| Funcionalidade | Detalhe |
|----------------|---------|
| Cadastro por e-mail | E-mail + senha com hash bcrypt/argon2 |
| Login por Google (OAuth 2.0) | Integração via Auth.js ou NextAuth |
| Login por Apple |
| Login por telefone (OTP) | Código enviado por SMS |
| Recuperação de senha | Link por e-mail com token de uso único e expiração |
| Verificação de e-mail | Token enviado após cadastro; acesso limitado antes de verificar |
| Verificação de telefone | OTP via SMS |
| Aceite de termos | LGPD, Termos de Uso e Política de Privacidade (obrigatório) |
| Tipo de conta | Comprador, vendedor ou ambos — selecionável no cadastro |
| Sessão | JWT + refresh token rotativo; expiração configurável |

---

### M02 — Perfil do Comprador

| Funcionalidade | Detalhe |
|----------------|---------|
| Dados pessoais | Nome, foto de perfil, e-mail, telefone |
| Favoritos | Lista de anúncios salvos |
| Buscas salvas | Lista de consultas com alertas de novas correspondências |
| Histórico de conversas | Acesso ao histórico de chats com vendedores |
| Preferências de notificação | Controle de canais: e-mail, push, in-app |

---

### M03 — Perfil do Vendedor

| Funcionalidade | Detalhe |
|----------------|---------|
| Tipo de vendedor | Pessoa física ou jurídica (CNPJ) |
| Nome da loja / razão social | Exibido publicamente |
| Foto / logo | Upload de imagem |
| Descrição da loja | Texto livre com regras de publicação |
| Endereço e região de atendimento | Cidade, estado, raio de entrega (opcional) |
| Telefone / WhatsApp | Exibível ou ocultável conforme configuração |
| Indicadores públicos | Tempo médio de resposta, anúncios ativos, avaliações |
| Selo de verificado | Concedido após validação documental pela moderação |

---

### M04 — Catálogo Automotivo

| Entidade | Atributos |
|----------|-----------|
| Marca | Nome, país de origem, logotipo |
| Modelo | Marca, nome, segmento (hatch, sedan, SUV etc.) |
| Versão | Modelo, nome, motorizações disponíveis |
| Ano do modelo | Versão, ano de fabricação, ano do modelo |

---

### M05 — Cadastro de Sucata / Veículo Base

| Campo | Obrigatório | Detalhe |
|-------|:-----------:|---------|
| Marca | ✅ | Selecionada do catálogo |
| Modelo | ✅ | Selecionado do catálogo |
| Versão | ✅ | Selecionada do catálogo |
| Ano de fabricação | ✅ | Campo numérico |
| Ano do modelo | ✅ | Campo numérico |
| Localização do Anúncio | ✅ | CEP (para busca por proximidade) |
| Fotos | ✅ | Mín. 4, máx. 10 |
| Peças disponíveis | ✅ | Lista fixa de categorias de peças; vendedor marca quais estão disponíveis naquele veículo |
| Cor | Não | Selecionável |
| Observações | Não | Texto livre — estado geral do veículo, histórico, peças já retiradas, etc. |

---

### M07 — Busca e Descoberta

#### Modos de Busca

| Modo | Entrada | Resultado |
|------|---------|-----------|
| **Por veículo** | Marca + Modelo + Ano + Versão | Lista de sucatas cadastradas daquele modelo |
| **Busca textual livre** | Qualquer texto | Busca nos campos de texto livre do veículo |

#### Filtros Disponíveis

| Filtro | Tipo | Valores |
|--------|------|---------|
| Marca do veículo | Seleção múltipla | Lista do catálogo |
| Modelo do veículo | Seleção condicional | Dependente da marca |
| Ano | Intervalo | De / Até |
| Localização | Raio ou estado | Km ou UF |

#### Ordenação

- Relevância (padrão) | Mais recentes | Mais próximos

#### Recursos de UX

- **Sugestão de refinamento** quando os resultados são excessivos.
- **"Nenhum resultado":** sugestão de salvar alerta para o item buscado.

---

### M08 — Gestão de Anúncios do Vendedor

| Ação | Descrição |
|------|-----------|
| Criar anúncio | Veículo base |
| Editar anúncio | Alterar qualquer campo; exige nova revisão |
| Pausar anúncio | Ocultar temporariamente sem encerrar |
| Republicar | Reativar anúncio pausado ou vencido |
| Encerrar | Finalizar definitivamente |
| Duplicar | Clonar como base para um novo anúncio |
| Marcar veículo como vendido | Remove dos resultados públicos; mantém histórico |
| Atualizar peças disponíveis | Desmarcar peças já negociadas da lista do veículo após acerto via chat |
| Atualizar fotos | Enviar novas fotos do veículo conforme peças são retiradas |
| Ver estatísticas | Visualizações, favoritos, contatos iniciados, taxa de resposta |

---

### M09 — Moderação e Confiança

| Funcionalidade | Detalhe |
|----------------|---------|
| Denúncia de anúncio | Motivos: informação falsa, peça errada, fraude, conteúdo impróprio |
| Denúncia de usuário | Motivos: assédio, golpe, comportamento abusivo |
| Fila de moderação | Analisada em ordem de prioridade/gravidade |
| Ocultação preventiva | Anúncios com alta gravidade são ocultados antes da análise |
| Aprovação / reprovação | Moderador pode publicar, ocultar, devolver ou bloquear |
| Bloqueio de duplicatas | Sistema detecta anúncios similares do mesmo vendedor |
| Validação de fotos | Rejeição de imagens muito pequenas ou inapropriadas |
| Controle de termos proibidos | Blacklist de palavras não permitidas |
| Score de risco | Vendedor com múltiplas denúncias recebe score maior |
| Selo de verificado | Concedido após KYC mínimo |
| Log de auditoria | Registro imutável de ações críticas |
| Bloqueio de usuário | Suspensão temporária ou definitiva |

---

### M10 — Administração

| Área | Funcionalidades |
|------|----------------|
| Gestão de usuários | Search, visualização, bloqueio, desbloqueio, alteração de papel |
| Gestão de vendedores | KYC, verificação, selos, histórico, métricas |
| Gestão de categorias | CRUD de categorias e subcategorias de peças |
| Gestão do catálogo automotivo | CRUD de marcas, modelos, versões, anos, motorizações |
| Moderação | Fila de denúncias, anúncios pendentes, conversas suspeitas |
| Relatórios | Anúncios por status, conversas por período, usuários ativos |
| CMS básico | Edição de banners, FAQ, termos e política de privacidade |
| Logs de auditoria | Visualização e exportação de logs |

---

### M11 — Notificações

| Evento | Canal |
|--------|-------|
| Nova mensagem de chat | In-app + e-mail + push |
| Anúncio aprovado | E-mail + in-app |
| Anúncio reprovado / devolvido | E-mail + in-app |
| Denúncia recebida | In-app (moderação) |
| Alerta de busca — novo anúncio match | E-mail + push |
| Conta bloqueada | E-mail |

**Canais:** E-mail transacional (Resend/SendGrid) · Push via FCM · Notificação in-app

---

### M12 — Suporte e Conteúdo

| Funcionalidade | Detalhe |
|----------------|---------|
| FAQ | Perguntas frequentes por categoria |
| Central de ajuda | Artigos detalhados com busca interna |
| Termos de uso | Documento editável pelo time |
| Política de privacidade | Documento LGPD editável |
| Regras de publicação | Guia para vendedores sobre o que é permitido/proibido |
| Canal de suporte / ticket | Formulário de contato com SLA definido |

---

## 6. Fluxos Principais

### 6.1 Fluxo do Vendedor — Publicação Completa

```
1. CADASTRO
   └── Criar conta (e-mail / Google / telefone)
   └── Verificar e-mail e/ou telefone
   └── Aceitar termos e LGPD

2. PERFIL
   └── Preencher perfil do vendedor
   └── Informar tipo (PF ou PJ), endereço e contatos
   └── Aguardar verificação (se solicitar selo)

3. VEÍCULO
   └── Acessar "Novo anúncio"
   └── Selecionar marca → modelo → ano → versão
   └── Informar localização (CEP)
   └── Selecionar peças disponíveis na lista fixa de categorias
   └── Fazer upload de fotos do veículo
   └── Inserir observações (opcional)

5. PUBLICAÇÃO
   └── Confirmar publicação
   └── Sistema valida campos obrigatórios e duplicidade
   └── Sempre enviar para revisão
   └── Notificação ao vendedor sobre status

6. GESTÃO CONTÍNUA
   └── Receber notificação de nova mensagem
   └── Responder via chat
   └── Atualizar disponibilidade dos anúncios
   └── Monitorar estatísticas do anúncio
```

---

### 6.2 Fluxo do Comprador — Busca por Veículo

```
1. CHEGADA → Acessar plataforma (autenticado ou visitante)
2. PESQUISA → Selecionar marca → modelo → ano → versão e/ou digitar nome da peça no campo de texto livre.
3. RESULTADOS → Ver lista de veículos/anúncios compatíveis → Ordenar
4. DETALHES → Abrir anúncio → Galeria de fotos → Peças disponíveis / Dados do vendedor (sem preços exibidos)
5. AÇÃO → Favoritar / Iniciar chat / Denunciar
6. PÓS-BUSCA → Salvar busca → Receber alertas de novos anúncios par este modelo específico selecionado
```

---

### 6.4 Fluxo de Moderação

```
1. ENTRADA → Publicação de anúncio OU denúncia de usuário
2. VALIDAÇÃO AUTOMÁTICA → Campos obrigatórios / Fotos válidas / Termos proibidos / Duplicidade
3. DECISÃO AUTOMÁTICA → Publicar diretamente OU enviar para revisão manual
4. REVISÃO MANUAL → Moderador analisa fila → Aprovar / Reprovar / Solicitar ajuste / Bloquear
5. AÇÃO → Sistema executa decisão → Registra auditoria → Notifica envolvidos
```

---

## 7. Casos de Uso

### 7.1 Atores do Sistema

| Ator | Tipo | Descrição |
|------|------|-----------|
| Comprador | Principal | Usuário que busca e negocia peças |
| Vendedor | Principal | Usuário que publica e gerencia anúncios |
| Administrador/Moderador | Principal | Garante qualidade da plataforma |
| Serviço de Chat | Suporte | Sistema de mensagens em tempo real |
| Serviço de Notificações | Suporte | Sistema de envio de alertas |
| Serviço de Autenticação | Suporte | Gerenciamento de identidade e sessão |

### 7.2 Mapa de Casos de Uso

```
[Comprador]
  ├── UC01: Cadastrar conta
  ├── UC02: Autenticar-se no sistema
  ├── UC03: Pesquisar por veículo (marca / modelo / versão / ano / texto livre)
  ├── UC04: Visualizar lista de anúncios compatíveis
  ├── UC05: Visualizar detalhes do anúncio
  ├── UC06: Favoritar anúncio
  ├── UC07: Iniciar chat com vendedor
  ├── UC08: Enviar mensagem e anexos no chat
  └── UC10: Denunciar anúncio ou usuário

[Vendedor]
  ├── UC01, UC02
  ├── UC11: Cadastrar perfil de vendedor
  ├── UC12: Cadastrar veículo / sucata
  ├── UC14: Editar anúncio
  ├── UC15: Publicar anúncio
  ├── UC16: Gerenciar disponibilidade do anúncio
  ├── UC17: Responder chat
  └── UC18: Encerrar anúncio / marcar anúncio como vendido

[Administrador/Moderador]
  ├── UC19: Revisar denúncia
  ├── UC20: Aprovar / reprovar / ocultar anúncio
  ├── UC21: Bloquear usuário
  ├── UC22: Gerenciar categorias e taxonomia automotiva
  ├── UC23: Auditar conversas e ações críticas
  └── UC24: Emitir notificações operacionais

Relações:
  (UC08) <<include>> (Validar anúncio ativo)
  (UC15) <<extend>>  (Enviar para revisão)
  (UC19) <<include>> (Registrar auditoria)
```

---

### 7.3 Especificações Detalhadas

#### UC03 — Pesquisar Veículo

**Objetivo:** Permitir que o comprador encontre veículos desejados.  
**Atores:** Comprador, Sistema  
**Pré-condições:** Catálogo automotivo e anúncios ativos disponíveis.

**Fluxo Principal:**
1. Comprador acessa a barra de busca.
2. Informa marca, modelo, versão, ano, nome da peça no campo de texto livre.
3. Sistema exibe filtros relevantes.
4. Comprador aplica filtros desejados.
5. Sistema processa a busca com compatibilidade automotiva.
6. Sistema exibe lista de anúncios/veículos ordenados.
7. Comprador acessa os detalhes de um resultado.

**Fluxos Alternativos:**
- **A1 — Nenhum resultado:** Sugere salvar alerta ou refinar busca.
- **A2 — Resultados excessivos:** Sugere refinamento adicional.

---

#### UC06 — Visualizar Detalhes do Anúncio

**Objetivo:** Exibir informações suficientes para o comprador decidir contatar o vendedor.  
**Atores:** Comprador, Sistema

**Fluxo Principal:**
1. Comprador seleciona um anúncio.
2. Sistema carrega a página de detalhes.
3. Sistema apresenta: galeria de fotos, dados do veículo, lista de peças disponíveis, localização, dados do vendedor, status do anúncio. **Nenhum preço é exibido.**
4. Comprador escolhe: Favoritar, Iniciar Chat ou Denunciar.

**Restrição:** A tela de detalhes não exibe preços. O único canal de negociação de valores é o chat integrado com o vendedor.

**Pós-condições:** Visualização registrada para analytics e estatísticas do vendedor.

---

#### UC08 — Iniciar Chat com Vendedor

**Objetivo:** Permitir negociação contextualizada, vinculada ao anúncio específico.  
**Atores:** Comprador, Vendedor, Serviço de Chat  
**Pré-condições:** Anúncio publicado; comprador autenticado; vendedor habilitado.

**Fluxo Principal:**
1. Comprador clica em "Entrar em contato".
2. Sistema verifica autenticação e status do anúncio.
3. Sistema cria ou recupera o canal de conversa vinculado ao anúncio.
4. Sistema carrega o chat com contexto do anúncio visível.
5. Comprador envia a primeira mensagem.
6. Sistema notifica o vendedor (in-app + push/e-mail se offline).
7. Vendedor responde; partes trocam mensagens livremente.

**Fluxos Alternativos:**
- **A1 — Anúncio vendido:** Sistema bloqueia abertura de novo chat.
- **A2 — Vendedor suspenso:** Sistema informa indisponibilidade.
- **A3 — Comprador não autenticado:** Redireciona para login e retorna ao anúncio.
- **A4 — Denúncia no chat:** Sistema copia a conversa e encaminha à moderação.

**Pós-condições:** Canal criado ou reutilizado (único por [anúncio + comprador + vendedor]); histórico persistido.

---

#### UC12 — Cadastrar Veículo / Sucata

**Objetivo:** Permitir ao vendedor publicar o veículo.  
**Atores:** Vendedor, Sistema  
**Pré-condições:** Vendedor autenticado com perfil completo.

**Fluxo Principal:**
1. Vendedor acessa o painel e clica em "Novo anúncio".
2. Vendedor seleciona Marca → Modelo → Ano → Versão.
3. Vendedor informa localização.
4. Vendedor faz upload das fotos.
5. Vendedor informa peças disponíveis no seletor de insersão de peças.
6. Sistema valida campos obrigatórios e verifica duplicidade.
7. Sistema publica ou envia para revisão.

**Fluxos Alternativos:**
- **A1 — Campos ausentes:** Destaca campos e impede avanço.
- **A2 — Duplicidade:** Alerta o vendedor; envia para revisão se confirmado.
- **A3 — Fotos inválidas:** Recusa fotos abaixo de 400px ou inapropriadas.

---


#### UC19 — Revisar Denúncia

**Objetivo:** Tratar fraude, abuso ou inconsistência reportada.  
**Atores:** Moderador, Sistema

**Fluxo:** Sistema classifica gravidade → Moderador acessa fila → Analisa evidências + histórico → Decide (Manter / Ocultar / Reprovar / Bloquear / Ajuste) → Sistema registra auditoria e notifica envolvidos.

---

## 8. Modelagem BPMN

### BPMN 01 — Publicação de Anúncio de Sucata

**Pools:** Vendedor | Plataforma | Moderação

```
POOL: Vendedor
  START EVENT: Vendedor decide anunciar
  TASK: Preencher dados do veículo
  TASK: Adicionar fotos
  TASK: Confirmar publicação
  MESSAGE FLOW → POOL: Plataforma

POOL: Plataforma
  TASK: Validar campos obrigatórios
  EXCLUSIVE GATEWAY: Dados válidos?
    [NÃO] → Retornar erros ao vendedor
    [SIM]  → Verificar duplicidade e registrar como "Pendente de Aprovação"
             MESSAGE FLOW → POOL: Moderação

POOL: Moderação
  TASK: Analisar dados (conferir fotos e descrição)
  EXCLUSIVE GATEWAY: Aprovado?
    [SIM]       → Alterar status para "Publicado" → Notificar vendedor → END
    [AJUSTE]    → Marcar como "Em Revisão" → MESSAGE FLOW → Vendedor [feedback]
    [REPROVADO] → Marcar como "Reprovado" → Registrar justificativa → Notificar vendedor → END
```

---

### BPMN 02 — Busca e Contato do Comprador

**Pools:** Comprador | Plataforma | Vendedor

```
POOL: Comprador
  START EVENT: Comprador precisa de uma peça
  TASK: Informar peça ou veículo na busca
  MESSAGE FLOW → POOL: Plataforma

POOL: Plataforma
  TASK: Processar busca (full-text + filtros + compatibilidade)
  TASK: Retornar resultados ordenados
  MESSAGE FLOW → POOL: Comprador

POOL: Comprador (continuação)
  EXCLUSIVE GATEWAY: Encontrou resultado?
    [NÃO] → Salvar alerta → END
    [SIM]  → Ver detalhes do anúncio
             EXCLUSIVE GATEWAY: Deseja contatar?
               [NÃO] → Favoritar / Salvar → END
               [SIM]  → Clicar "Entrar em contato"
                         MESSAGE FLOW → Plataforma

POOL: Plataforma (validação)
  TASK: Verificar autenticação e status do anúncio
  EXCLUSIVE GATEWAY: Anúncio ativo?
    [NÃO] → Informar indisponibilidade → END
    [SIM]  → Criar/recuperar canal de chat
              MESSAGE FLOW → Vendedor (notificar)
              MESSAGE FLOW → Comprador (abrir chat)

POOL: Comprador + Vendedor
  TASK: Troca de mensagens (loop)
  END EVENT: Negociação iniciada
```

---

### BPMN 03 — Denúncia e Moderação

**Pools:** Usuário Denunciante | Plataforma | Moderador | Vendedor Denunciado

```
POOL: Usuário Denunciante
  START EVENT: Identifica problema
  TASK: Selecionar motivo → Enviar denúncia
  MESSAGE FLOW → POOL: Plataforma

POOL: Plataforma
  TASK: Registrar e calcular gravidade (Alta / Média / Baixa)
  EXCLUSIVE GATEWAY: Gravidade Alta?
    [SIM] → Ocultar preventivamente → Notificar vendedor
    [NÃO] → Manter visível
  TASK: Enfileirar para moderação
  MESSAGE FLOW → POOL: Moderador

POOL: Moderador
  TASK: Analisar: anúncio, histórico, evidências, chat copiado
  EXCLUSIVE GATEWAY: Denúncia procedente?
    [NÃO] → Arquivar → Restaurar anúncio → Notificar denunciante
    [SIM]  → Aplicar ação (reprovar / bloquear / devolver)
  TASK: Registrar log de auditoria
  MESSAGE FLOW → Plataforma + Envolvidos
  END EVENT: Caso encerrado
```

---

### BPMN 04 — Atualização de Disponibilidade / Venda

```
START EVENT: Vendedor conclui negociação externa
TASK: Acessar painel → Localizar veículo
EXCLUSIVE GATEWAY: Ação desejada?
  [Vendida]    → Remover da busca; notificar compradores em favoritos
  [Disponível] → Reindexar na busca
MESSAGE FLOW: Notificar compradores em favoritos
END EVENT: Status atualizado
```

---

### BPMN 05 — Onboarding e Verificação do Vendedor

```
START EVENT: Usuário decide se tornar vendedor
TASK: Preencher perfil completo
EXCLUSIVE GATEWAY: Dados completos?
  [NÃO] → Vendedor corrige
  [SIM]  → Verificação automática (e-mail + telefone)
            EXCLUSIVE GATEWAY: Solicita Selo Verificado?
              [NÃO] → END: Vendedor ativo sem selo
              [SIM]  → MODERAÇÃO: Revisar documentação
                        EXCLUSIVE GATEWAY: Aprovado?
                          [SIM] → Conceder Selo → END
                          [NÃO] → Notificar pendências → END
```

---

## 9. Diagramas de Atividade UML

### 9.1 Buscar Peça e Iniciar Chat

```
[INÍCIO]
  │
[ACESSAR BUSCA] → [INFORMAR MARCA/MODELO/ANO/VERSÃO]
  │
[AUTOCOMPLETE DO CAMPO DE TEXTO LIVRE] → [CONFIRMAR TERMO]
  │
[APLICAR FILTROS]
  │
[PROCESSAR BUSCA]
  │
◇ HÁ RESULTADOS?
├── [NÃO] → [EXIBIR "NENHUM RESULTADO"] → [SUGERIR REFINAMENTO/ALERTA] → [FIM]
└── [SIM]
    [LISTAR RESULTADOS] → [SELECIONAR ANÚNCIO]
    [VER DETALHES: fotos, estado, compatibilidade, vendedor]
    │
    ◇ DESEJA CONTATAR?
    ├── [NÃO] → [Favoritar] ou [Salvar Busca] → [FIM]
    └── [SIM] → [CLICAR "ENTRAR EM CONTATO"]
                 │
                 ◇ AUTENTICADO?
                 ├── [NÃO] → [LOGIN] → [RETORNAR AO ANÚNCIO]
                 └── [SIM]
                     ◇ ANÚNCIO ATIVO?
                     ├── [NÃO] → [INFORMAR INDISPONÍVEL] → [FIM]
                     └── [SIM]
                         [CRIAR/RECUPERAR CANAL DE CHAT]
                         [ENVIAR PRIMEIRA MENSAGEM]
                         [NOTIFICAR VENDEDOR]
                         [FIM]
```

---

### 9.2 Publicar Veículo/Sucata

```
[INÍCIO]
[ACESSAR PAINEL] → [NOVO ANÚNClO]
[SELECIONAR MARCA → MODELO → ANO → VERSÃO]
[INFORMAR LOCALIZAÇÃO (CEP)]
  │
[VISUALIZAR LISTA FIXA DE CATEGORIAS DE PEÇAS]
[MARCAR PEÇAS DISPONÍVEIS NO VEÍCULO]
  │
[UPLOAD FOTOS DO VEÍCULO]
[PREENCHER OBSERVAÇÕES (OPCIONAL)]
  │
[CONFIRMAR PUBLICAÇÃO]
[VALIDAR CAMPOS OBRIGATÓRIOS]
  │
◇ VÁLIDO?
├── [NÃO] → [EXIBIR ERROS] → [CORRIGIR] → [LOOP]
└── [SIM] → [VERIFICAR DUPLICIDADE]
              [MARCAR COMO PENDENTE DE APROVAÇÃO]
              [NOTIFICAR FILA DE MODERAÇÃO]
              [MODERADOR ANALISA]
              │
              ◇ APROVADO?
              ├── [SIM] → [ALTERAR STATUS: PUBLICADO] → [NOTIFICAR VENDEDOR] → [FIM]
              ├── [AJUSTE] → [DEVOLVER AO VENDEDOR COM FEEDBACK] → [LOOP]
              └── [NÃO] → [REPROVAR ANÚNCIO] → [NOTIFICAR VENDEDOR] → [FIM]

--- GESTÃO PÓS-PUBLICAÇÃO (quando peças são negociadas via chat) ---

[VENDEDOR CONCLUI NEGOCIAÇÃO VIA CHAT]
[ACESSAR PAINEL → LOCALIZAR VEÍCULO]
[DESMARCAR PEÇAS JÁ NEGOCIADAS DA LISTA]
[UPLOAD DE NOVAS FOTOS do veículo atualizado (OPCIONAL)]
[FIM]
```

---

### 9.3 Denúncia de Anúncio

```
[INÍCIO]
[USUÁRIO ACIONA "DENUNCIAR"]
[SELECIONAR MOTIVO] → [DESCREVER (opcional)] → [CONFIRMAR]
[REGISTRAR DENÚNCIA E COPIAR ESTADO ATUAL]
[CALCULAR GRAVIDADE]
  │
◇ GRAVIDADE ALTA?
├── [SIM] → [OCULTAR PREVENTIVAMENTE] → [NOTIFICAR VENDEDOR]
└── [NÃO] → [MANTER VISÍVEL]
  │
[ENCAMINHAR PARA FILA DE MODERAÇÃO]
[MODERADOR ANALISA]
  │
◇ PROCEDENTE?
├── [NÃO] → [ARQUIVAR] → [RESTAURAR ANÚNCIO] → [NOTIFICAR DENUNCIANTE]
└── [SIM]
    ◇ AÇÃO:
    ├── [Ajuste]  → [DEVOLVER AO VENDEDOR]
    ├── [Ocultar] → [REPROVAR ANÚNCIO]
    └── [Bloquear] → [SUSPENDER CONTA]
    │
    [REGISTRAR AUDITORIA] → [NOTIFICAR ENVOLVIDOS] → [FIM]
```

---

## 10. Requisitos Funcionais

### 10.1 Autenticação e Usuários

| ID | Requisito |
|----|-----------|
| **RF01** | O sistema deve permitir cadastro de usuário como comprador, vendedor ou perfil misto. |
| **RF02** | O sistema deve permitir autenticação por e-mail e senha. |
| **RF03** | O sistema deve permitir autenticação via Google (OAuth 2.0). |
| **RF04** | O sistema deve permitir autenticação via telefone (OTP por SMS). |
| **RF05** | O sistema deve permitir recuperação de senha via link seguro por e-mail. |
| **RF06** | O sistema deve exigir verificação de e-mail e/ou telefone antes de permitir publicação. |
| **RF07** | O sistema deve registrar aceite de Termos, Política de Privacidade e LGPD no cadastro. |
| **RF08** | O sistema deve permitir edição de dados do perfil do usuário. |

### 10.2 Perfil do Vendedor

| ID | Requisito |
|----|-----------|
| **RF09** | O sistema deve permitir cadastro de perfil de vendedor (PF ou PJ). |
| **RF10** | O sistema deve permitir informar localização e região de atendimento. |
| **RF11** | O sistema deve permitir informar canais de contato: telefone, WhatsApp e horário. |
| **RF12** | O sistema deve permitir upload de foto ou logotipo do vendedor. |
| **RF13** | O sistema deve exibir indicadores públicos do vendedor. |
| **RF14** | O sistema deve permitir concessão de Selo de Vendedor Verificado pela moderação. |

### 10.3 Catálogo Automotivo

| ID | Requisito |
|----|-----------|
| **RF15** | O sistema deve manter base de marcas, modelos, versões e anos de fabricação/modelo dos veículos. |

| **RF17** | O sistema deve permitir que administradores gerenciem a base automotiva. |

### 10.4 Cadastro de Veículo Sucata

| ID | Requisito |
|----|-----------|
| **RF19** | O sistema deve exigir: marca, modelo, versão, ano, localização e mínimo 4 fotos. |
| **RF20** | O sistema deve permitir upload de múltiplas fotos (mín. 4, máx. 10). |
| **RF23** | O sistema deve permitir informar observações gerais sobre o veículo (campo livre). |
| **RF24** | O sistema deve exibir uma lista fixa de categorias de peças ao vendedor durante o cadastro. |
| **RF25** | O sistema deve permitir ao vendedor marcar quais categorias de peças estão disponíveis no veículo. |
| **RF26** | O sistema deve permitir ao vendedor atualizar a lista de peças disponíveis e as fotos do veículo após negociações via chat. |


### 10.6 Busca e Descoberta

| ID | Requisito |
|----|-----------|
| **RF33** | O sistema deve permitir busca textual por nome de peça ou veículo. |
| **RF34** | O sistema deve oferecer autocomplete em tempo real durante a digitação. |
| **RF35** | O sistema deve permitir busca por veículo, retornando sucatas daquele modelo. |
| **RF37** | O sistema deve permitir filtros por: marca, modelo, ano, localização. |
| **RF38** | O sistema deve ordenar resultados por: relevância, data, proximidade. |
| **RF39** | O sistema deve tratar sinônimos e termos populares na busca. |
| **RF40** | O sistema deve permitir salvar buscas para alertas automáticos. |

### 10.7 Anúncio e Página de Detalhe

| ID | Requisito |
|----|-----------|
| **RF41** | O sistema deve exibir galeria de fotos do veículo. |
| **RF42** | O sistema deve exibir dados do veículo, lista de peças disponíveis e dados do vendedor. **Nenhum preço deve ser exibido.** |
| **RF43** | O sistema deve exibir o status do anúncio. |
| **RF44** | O sistema deve permitir favoritar o anúncio da página de detalhe. |
| **RF45** | O sistema deve exibir as ações: Chat, Favoritar e Denunciar. |

### 10.8 Chat e Negociação

| ID | Requisito |
|----|-----------|
| **RF46** | O sistema deve permitir iniciar chat a partir de um anúncio específico. |
| **RF47** | O sistema deve criar canal único por [comprador + vendedor + anúncio]. |
| **RF48** | O sistema deve manter histórico completo de conversas por anúncio. |
| **RF49** | O sistema deve permitir envio de texto e imagens no chat. |
| **RF50** | O sistema deve notificar destinatário sobre novas mensagens (in-app + push + e-mail). |
| **RF51** | O sistema deve exibir indicadores de mensagem lida. |
| **RF52** | O sistema deve permitir denúncia e bloqueio diretamente no chat. |
| **RF53** | O sistema deve disponibilizar respostas rápidas pré-cadastradas para o vendedor. |
| **RF54** | O sistema deve enviar aviso automático quando peça for reservada ou vendida. |

### 10.9 Favoritos e Alertas

| ID | Requisito |
|----|-----------|
| **RF55** | O sistema deve permitir salvar anúncios como favoritos. |
| **RF56** | O sistema deve permitir salvar buscas. |
| **RF57** | O sistema deve enviar alerta quando novos anúncios corresponderem a uma busca salva. |
| **RF58** | O sistema deve permitir ao comprador criar um alerta por modelo de veículo para ser notificado quando um novo anúncio compatível for publicado — inclusive quando a busca não retornar resultados. |

### 10.10 Gestão de Anúncios (Vendedor)

| ID | Requisito |
|----|-----------|
| **RF59** | O sistema deve permitir criar, editar, pausar, republicar e encerrar anúncios. |
| **RF60** | O sistema deve permitir duplicar anúncio como modelo. |
| **RF61** | O sistema deve permitir atualização rápida de disponibilidade. |
| **RF62** | O sistema deve exibir estatísticas por anúncio: visualizações, favoritos, chats, taxa de resposta. |

### 10.11 Moderação e Confiança

| ID | Requisito |
|----|-----------|
| **RF63** | O sistema deve permitir denúncia de anúncios com motivo selecionável. |
| **RF64** | O sistema deve permitir denúncia de usuários. |
| **RF65** | O sistema deve permitir que moderadores revisem anúncios denunciados. |
| **RF66** | O sistema deve detectar e sinalizar suspeita de duplicidade. |
| **RF67** | O sistema deve impedir upload de imagens abaixo do mínimo de resolução. |
| **RF68** | O sistema deve aplicar controle de termos proibidos em anúncios. |
| **RF69** | O sistema deve calcular score de risco automático para anúncios e usuários. |
| **RF70** | O sistema deve registrar log imutável de ações críticas. |
| **RF71** | O sistema deve ocultar anúncios preventivamente em casos de alta gravidade. |

### 10.12 Administração

| ID | Requisito |
|----|-----------|
| **RF72** | O sistema deve permitir gestão completa de usuários: busca, visualização, bloqueio e desbloqueio. |
| **RF73** | O sistema deve permitir gestão de categorias de peças e atributos. |
| **RF74** | O sistema deve permitir gestão da base automotiva (marcas, modelos, versões, anos). |
| **RF75** | O sistema deve gerar relatórios operacionais. |
| **RF76** | O sistema deve oferecer CMS básico para edição de banners, FAQ, termos e política. |
| **RF77** | O sistema deve disponibilizar uma fila de aprovação de novos anúncios para os moderadores. |
| **RF78** | O sistema deve permitir ao moderador aprovar, reprovar ou solicitar ajustes em um anúncio pendente. |

---

## 11. Requisitos Não Funcionais

| ID | Categoria | Requisito |
|----|-----------|-----------|
| **RNF01** | Responsividade | Totalmente responsivo para mobile (320px+) e desktop. |
| **RNF02** | Performance de Busca | Resposta em até 500ms para 95% das requisições. |
| **RNF03** | Tempo Real | Chat com latência máxima de 300ms para entrega de mensagens. |
| **RNF04** | Auditoria | Trilha de auditoria imutável para ações sensíveis. |
| **RNF05** | LGPD | Cumprimento integral da Lei 13.709/2018. |
| **RNF06** | Segurança de Dados | Dados sensíveis protegidos com criptografia; nunca exibidos integralmente. |
| **RNF07** | Antifraude | Mecanismos de detecção de spam, fraude e perfis falsos. |
| **RNF08** | Escalabilidade de Mídia | Upload e armazenamento escalável de imagens sem impacto no servidor. |
| **RNF09** | Alta Disponibilidade | SLA de 99,5% para busca e chat. |
| **RNF10** | SEO | Indexação eficiente para anúncios e categorias. |
| **RNF11** | Acessibilidade | Conformidade com WCAG 2.1 nível AA. |
| **RNF12** | Segurança Web | HTTPS, CSP, rate limiting, HSTS, proteção contra CSRF, XSS e SQL Injection. |
| **RNF13** | Core Web Vitals | LCP < 2,5s nas páginas públicas de anúncio. |

---

## 12. Regras de Negócio

| ID | Regra |
|----|-------|
| **RN01** | A plataforma não intermedeia pagamento. Toda transação financeira ocorre fora do sistema. |
| **RN02** | A negociação ocorre diretamente entre partes, sem checkout. |
| **RN03** | Um anúncio representa sempre um **veículo completo (sucata)**. Não existem anúncios de peças avulsas independentes. |
| **RN04** | A plataforma **não exibe preços**. Toda negociação de valor ocorre exclusivamente via chat entre comprador e vendedor. |
| **RN05** | **Chassi não é campo do sistema.** Sucatas frequentemente não possuem este dado; sua coleta não faz parte do modelo de negócio. |
| **RN06** | Ao marcar Veículo como "Vendido", ele é removido dos resultados públicos ou fica indisponível. |
| **RN07** | O vendedor é inteiramente responsável pela veracidade das informações publicadas. |
| **RN09** | Anúncios denunciados com alta gravidade podem ser ocultados preventivamente a depender da quantidade de denúncias em um certo período de tempo a ser definido. |
| **RN10** | O sistema deve detectar e sinalizar anúncios duplicados. |
| **RN11** | Chat só pode ser iniciado em anúncios com status "Publicado". Vendidos não são listados. |
| **RN12** | Vendedor bloqueado não pode receber novas mensagens nem ter anúncios exibidos. |
| **RN13** | O Selo de Verificado é concedido exclusivamente pela moderação após validação documental. |
| **RN14** | **Aprovação Mandatória:** Todo anúncio novo ou editado deve obrigatoriamente passar pela aprovação de um moderador antes de se tornar visível publicamente ("Publicado"). |

---

## 13. Modelo de Domínio — Entidades

### 13.1 Diagrama de Entidades (Resumo)

```
User ──── Role
  │
  ├── SellerProfile ────── SellerStats
  │       │
  │       └── Vehicle (Sucata) ──── VehiclePhoto
  │             │
  │             ├── VehicleVersion ──── VehicleModel ──── VehicleBrand
  │             └── availableParts[] ──── PartCategory (lista fixa do sistema)
  │
  ├── BuyerProfile
  │       ├── Favorite ──── Listing
  │       └── SavedSearch ──── Alert
  │
  ├── ChatRoom ──── Listing
  │       └── ChatMessage
  │
  ├── Notification
  ├── Report ──── ModerationCase
  └── AuditLog
```

---

### 13.2 Descrição das Entidades

| Entidade | Descrição | Atributos-Chave |
|----------|-----------|-----------------|
| **User** | Usuário da plataforma | id, email, phone, passwordHash, type, status, emailVerified, phoneVerified, createdAt |
| **Role** | Papel do usuário | id, name (buyer/seller/moderator/admin), permissions[] |
| **SellerProfile** | Dados públicos do vendedor | id, userId, storeName, type (PF/PJ), cnpj, address, city, state, lat, lng, whatsapp, phone, openHours, logo, description, responseTimeAvg, isVerified |
| **BuyerProfile** | Dados do comprador | id, userId, name, avatar |
| **VehicleBrand** | Marca do veículo | id, name, country, logo |
| **VehicleModel** | Modelo do veículo | id, brandId, name, segment |
| **VehicleVersion** | Versão do modelo | id, modelId, name, engineCode, displacement, fuel, transmission |
| **VehicleYear** | Ano de fabricação/modelo | id, versionId, yearFab, yearModel |
| **Vehicle (Sucata)** | Veículo de origem da sucata | id, sellerId, versionId, yearFabId, availableParts (JSON — IDs de PartCategory), plate? (masked), observations, color, city, state, lat?, lng?, status (Draft, Pending, Active, Inactive, Sold) |
| **VehiclePhoto** | Fotos do veículo | id, vehicleId, url, order, type |
| **PartCategory** | Lista fixa de categorias de peças disponíveis no sistema | id, name, slug, icon |
| **Listing** | Anúncio público (referência ao veículo) | id, sellerId, vehicleId, title, status (Pending, Published, Rejected, Sold, Expired), views, favoritesCount, publishedAt, expiresAt |
| **Favorite** | Anúncio salvo | id, userId, listingId, createdAt |
| **SavedSearch** | Busca salva | id, userId, query, filters (JSON), alertActive |
| **Alert** | Alerta de busca salva | id, savedSearchId, listingId, sentAt |
| **ChatRoom** | Canal de conversa por anúncio | id, listingId, buyerId, sellerId, status, createdAt |
| **ChatMessage** | Mensagem individual | id, roomId, senderId, content, type (text/image), readAt, createdAt |
| **Notification** | Notificação do sistema | id, userId, type, content, read, channel, createdAt |
| **Report** | Denúncia | id, reporterId, targetType, targetId, reason, description, severity, status, createdAt |
| **ModerationCase** | Caso de moderação | id, reportId, moderatorId, status, decision, notes, resolvedAt |
| **AuditLog** | Log imutável de ações | id, actorId, action, targetType, targetId, metadata (JSON), ip, userAgent, createdAt |

---

## 14. Arquitetura Técnica

### 14.1 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Frontend / App** | React Native (Expo SDK 51+) | App multiplataforma iOS/Android; Expo Router para navegação nativa |
| **Linguagem** | TypeScript | Segurança de tipos ponta a ponta |
| **Backend API** | Node.js com NestJS | Estrutura enterprise com DI, guards e módulos |
| **ORM** | Prisma | Type-safe, migrations, Supabase/PostgreSQL |
| **Banco de Dados** | Supabase (PostgreSQL gerenciado) | Banco gerenciado, auth integrada, storage e realtime incluídos |
| **Busca** | PG Full-Text nativo (MVP) | Supabase suporta full-text; OpenSearch na Fase 2 |
| **Cache / Sessão** | Redis (Upstash) | Cache, sessões distribuídas, pub/sub |
| **Chat** | Socket.IO + Redis Adapter | WebSocket escalável horizontalmente |
| **Armazenamento de Mídia** | Supabase Storage ou AWS S3/R2 | Imagens fora do servidor, CDN integrado |
| **Processamento Assíncrono** | BullMQ | Compressão de imagem, notificações, reindexação |
| **Autenticação** | Supabase Auth ou JWT custom | JWT + refresh token rotativo |
| **Push** | Expo Notifications + FCM (Android) / APNs (iOS) | Push nativo para mobile |
| **E-mail** | Resend / SendGrid | E-mails de verificação, alertas, notificações |
| **CDN** | Cloudflare | Assets, imagens, cache de APIs públicas |
| **Deploy** | Vercel (API/Backend) + Expo EAS (mobile) | CI/CD simplificado; EAS para builds e OTA updates |
| **Monitoramento** | Grafana + Prometheus | Métricas, logs e alertas |
| **Logs** | Pino + Loki | Logging estruturado em JSON |

---

### 14.2 Diagrama de Componentes (Arquitetura)

```
       ┌───────────────────┐             ┌───────────────────┐
       │   Mobile App      │             │   Dashboard Web   │
       │ (React Native)    │             │ (Moderador/Admin) │
       └─────────┬─────────┘             └─────────┬─────────┘
                 │                                 │
                 └────────────────┬────────────────┘
                                  │
                 ┌────────────────▼────────────────┐
                 │        Gateway / Cloudflare     │
                 └────────────────┬────────────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       │                          │                          │
┌──────▼──────┐           ┌───────▼───────┐          ┌───────▼──────┐
│  Supabase   │           │    NestJS     │          │  Supabase    │
│    Auth     │           │ (API Backend) │          │  Realtime    │
└─────────────┘           └───────┬───────┘          └──────────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       │                          │                          │
┌──────▼──────┐           ┌───────▼───────┐          ┌───────▼──────┐
│  Supabase   │           │   PostgreSQL  │          │   Upstash    │
│   Storage   │           │ (Supabase DB) │          │   (Redis)    │
└──────┬──────┘           └───────┬───────┘          └───────┬──────┘
       │                          │                          │
       │                  ┌───────▼───────┐          ┌───────▼──────┐
       └──────────────────┤    BullMQ     │◄─────────┤  Expo Push   │
                          │   (Workers)   │          │ (Notifications)
                          └───────────────┘          └──────────────┘
```

---

### 14.3 Estratégia de Navegação e Carregamento (React Native)

| Contexto | Abordagem | Motivo |
|---|---|---|
| Listagem de veículos | FlashList (Shopify) + paginação cursor | Performance superior ao FlatList em listas longas |
| Detalhe do anúncio | Fetch on mount + React Query cache | Carregamento rápido pós-listagem |
| Chat | Socket.IO WebSocket em tempo real | Latência mínima |
| Dados da API | TanStack Query (React Query) | Revalidação automática, cache offline |
| Estado global | Zustand | Leve, performatíco |
| Navegação entre telas | Expo Router (file-based) | Deep links nativos para compartilhamento de anúncios |
| Atualizações do app | Expo EAS Update (OTA) | Correções sem nova publicação nas lojas |

---

### 14.4 Segurança

| Controle | Implementação |
|----------|--------------|
| Autenticação | JWT + refresh token rotativo; Supabase Auth ou HttpOnly cookies |
| Autorização | RBAC: comprador / vendedor / moderador / admin |
| Proteção de rotas | Middleware de autenticação no app (Expo Router) + guard NestJS |
| Validação de entrada | Zod (frontend) + class-validator (NestJS) |
| Rate limiting | Redis + NestJS throttler |
| Headers de segurança | Helmet.js; CSP; HSTS; X-Frame-Options |
| CORS | Configurado para domínios autorizados |
| Dados sensíveis | Placa mascarada quando informada; chassi não é coletado pelo sistema |
| Uploads | Validação de tipo MIME + tamanho; scan de conteúdo |
| Secrets | AWS Secrets Manager ou Vault; nunca em código |

---

## 15. Escalabilidade e Disponibilidade

### 15.1 Estratégia por Componente

| Componente | Escala | Observações |
|------------|--------|-------------|
| **Next.js App** | Horizontal | Stateless; sessão em Redis |
| **API Node** | Horizontal | Stateless; sem estado local |
| **PostgreSQL** | Vertical + réplicas de leitura | Write na primária; reads nas réplicas |
| **Redis** | Cluster mode | HA; pub/sub para chat e eventos |
| **Socket.IO** | Horizontal com Redis Adapter | Eventos compartilhados entre instâncias |
| **S3 / R2** | Altamente escalável | CDN na frente |
| **BullMQ** | Horizontal | Mais workers conforme demanda |
| **OpenSearch** | Horizontal (shards) | Fase 2 |

### 15.2 Alta Disponibilidade — Requisitos (SLA 99,5%)

- Mínimo 2 instâncias de cada serviço crítico.
- Load balancer com health check ativo.
- PostgreSQL com failover automático (RDS Multi-AZ ou equivalente).
- Redis com modo sentinela ou cluster.
- Deploy sem downtime (rolling update).
- Monitoramento com alertas para latência, erros e recursos.

### 15.3 Gargalos Previstos e Mitigações

| Gargalo | Mitigação |
|---------|-----------|
| Busca lenta | Migrar para OpenSearch; índices otimizados desde o MVP |
| Upload de imagens pesadas | Presigned URL direto para S3; compressão assíncrona via BullMQ |
| Chat com alta concorrência | Redis Adapter; horizontal scaling |
| SSR pesado em anúncios | ISR com cache longo; CDN agressivo |
| Banco lento em leituras | Réplica de leitura; índice otimizado; cache no Redis |

---

## 16. Estratégia de Implantação por Fase

### Fase 1 — MVP

| Componente | Configuração |
|------------|-------------|
| Next.js App | 1 instância (Vercel ou container) |
| API Node | API Routes ou serviço separado leve |
| PostgreSQL | Instância gerenciada (Supabase, Neon, Railway) |
| Redis | Instância gerenciada (Upstash ou Redis Cloud) |
| S3/R2 | Configurado desde o início (sem disco local) |
| Chat | Socket.IO integrado ao servidor Node |
| Deploy | Docker Compose ou plataforma gerenciada |

> **Capacidade estimada:** ~100 usuários simultâneos; ~10.000 anúncios.

### Fase 2 — Crescimento

- Separar API Node do Next.js em serviço dedicado.
- Escalar Next.js horizontalmente (2+ instâncias).
- Serviço de chat em processo dedicado.
- Filas BullMQ separadas por tipo de job.
- CDN agressivo (Cloudflare).
- Réplica de leitura no PostgreSQL.
- OpenSearch para busca avançada.

> **Capacidade estimada:** ~1.000 usuários simultâneos; ~100.000 anúncios.

### Fase 3 — Escala

- Multi-AZ ou multi-região.
- Redis Cluster com sentinela.
- OpenSearch maduro com múltiplos shards.
- Workers especializados por domínio.
- Failover automatizado.
- Observabilidade completa com SLOs formais.

> **Capacidade estimada:** 10.000+ usuários simultâneos; milhões de anúncios.

---

## 17. MVP — Escopo Mínimo Viável

### 17.1 Funcionalidades Incluídas no MVP

| # | Funcionalidade | Módulo |
|---|---------------|--------|
| 1 | Cadastro e login (e-mail + Google) | M01 |
| 2 | Verificação de e-mail | M01 |
| 3 | Perfil do vendedor (básico) | M03 |
| 4 | Cadastro de veículo/sucata | M05 |
| 5 | Busca por veículo | M07 |
| 6 | Filtros básicos (marca, modelo, cidade) | M07 |
| 7 | Página de anúncio completa | M08 |
| 8 | Chat básico (texto) | Chat |
| 9 | Favoritos | M02 |
| 10 | Painel do vendedor (gerenciar anúncios) | M08 |
| 12 | Painel admin básico | M10 |
| 13 | Denúncia de anúncio | M09 |
| 14 | Notificações básicas | M11 |

### 17.2 Excluídas do MVP (Fase 2+)

| Funcionalidade | Motivo |
|---------------|--------|
| Reputação avançada | Validar modelo de negócio primeiro |
| Sugestão inteligente de compatível (ML) | Requer dados suficientes |
| Ranking geográfico sofisticado | Depende de volume |
| Destaques pagos / monetização | Após validação do produto |
| Integração WhatsApp Business API | Custo e complexidade |
| Integração com ERP de desmanche | Nicho; depende de parceria |
| OpenSearch / Elasticsearch | PostgreSQL Full-Text atende no MVP |
| Relatórios avançados | Operação básica primeiro |

---

## 18. Backlog e Épicos

### 18.1 Épicos

| Épico | Descrição | Prioridade |
|-------|-----------|-----------|
| **E01** — Gestão de Contas | Cadastro, login, verificação, perfil, recuperação | 🔴 P0 |
| **E02** — Onboarding de Vendedores | Perfil, localização, contatos, verificação, selo | 🔴 P0 |
| **E03** — Catálogo Automotivo | Base de marcas/modelos/versões/anos, compatibilidade | 🔴 P0 |
| **E04** — Gestão de Sucatas  | CRUD de veículos, fotos, disponibilidade | 🔴 P0 |
| **E05** — Busca e Compatibilidade | Full-text, filtros, autocomplete, ordenação | 🔴 P0 |
| **E06** — Chat e Negociação | Canal por anúncio, histórico, notificação, denúncia | 🔴 P0 |
| **E07** — Moderação e Confiança | Denúncia, fila, auditoria, score de risco | 🟠 P1 |
| **E08** — Administração | Painel, relatórios, gestão de usuários | 🟠 P1 |
| **E09** — Notificações | E-mail, push, in-app, alertas de busca | 🟠 P1 |
| **E10** — Favoritos e Alertas | Salvar anúncios e buscas, alertas automáticos | 🟡 P2 |
| **E11** — Estatísticas do Vendedor | Visualizações, contatos, taxa de resposta | 🟡 P2 |
| **E12** — SEO e Performance | Metadados, sitemap, schema.org, Core Web Vitals | 🟠 P1 |

### 18.2 User Stories

```gherkin
Como vendedor,
  Quero cadastrar um veículo sucata com fotos e dados de desmonte,
  Para que compradores possam encontrar as peças disponíveis no meu pátio.

Como comprador,
  Quero pesquisar por "cabeçote" no campo de texto livre e selecionar  Fiat Palio 1.6 2007" 
  e ver todos os desmanches que podem ter a peça,
  Para comparar estado, preço e negociar com o mais próximo.

Como comprador,
  Quero abrir um chat diretamente no anúncio,
  Para negociar sem precisar sair da plataforma.

Como vendedor,
  Quero marcar um anúncio de veículo sucata como "vendido" diretamente do painel,
  Para evitar novos contatos sobre o veículo ou peça do veículo já negociado.

Como moderador,
  Quero revisar anúncios denunciados em uma fila por gravidade,
  Para resolver casos de fraude antes de causarem dano.

Como administrador,
  Quero adicionar uma nova versão de veículo ao catálogo,
  Para que vendedores possam cadastrar sucatas de modelos recentes.

Como comprador,
  Quero salvar minha busca por "amortecedor Volkswagen Gol G6",
  Para receber alerta quando um novo anúncio corresponder.
```

---

## 19. Riscos e Mitigações

### 19.1 Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:-----------:|:------:|-----------|
| Qualidade ruim de anúncios | Alta | Alto | Guia de publicação, validação de fotos, revisão moderada |
| Incompatibilidade anunciada erroneamente | Alta | Alto | Taxonomia rigorosa, denúncia fácil, aviso legal |
| Fraude em negociação (golpes) | Média | Alto | KYC, chat rastreável, score de risco, denúncia integrada |
| Baixa adoção por vendedores | Média | Alto | Onboarding guiado, poucos campos obrigatórios inicialmente |
| Mercado muito informal | Alta | Médio | Valor claro: mais visibilidade, organização e contatos qualificados |

### 19.2 Riscos Técnicos

| Risco | Mitigação |
|-------|-----------|
| Busca lenta com volume | OpenSearch no roadmap; índices otimizados desde o início |
| Chat instável com volume | Redis Adapter + horizontal scaling |
| Upload de imagens pesadas | Compressão assíncrona; limite por upload |
| Conformidade LGPD | Política clara; consentimento explícito; deleção a pedido |
| Servidor único frágil | Arquitetura stateless + Docker desde o MVP |

---

## 20. Glossário

| Termo | Definição |
|-------|-----------|
| **Sucata** | Veículo que passou por sinistro, baixa de placa ou desmonte intencional, do qual são retiradas peças para venda separada |
| **Veículo** | Sucata de veículo inteiro ou desmontado anunciado |
| **Anúncio** | Publicação de um veículo sucata, 
| **LCP** | Largest Contentful Paint — métrica de performance do maior elemento visível |
| **ISR** | Incremental Static Regeneration — gera páginas estáticas e as atualiza em background |
| **SSR** | Server-Side Rendering — renderização da página no servidor a cada requisição |
| **KYC** | Know Your Customer — processo de verificação de identidade |
| **LGPD** | Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018) |
| **BPMN** | Business Process Model and Notation — padrão para modelagem de processos |
| **Score de risco** | Pontuação calculada com base em denúncias, duplicidades e comportamento suspeito |
| **Selo de verificado** | Distintivo concedido após validação documental pela moderação |
| **BullMQ** | Biblioteca Node.js para filas e jobs assíncronos, baseada em Redis |
| **Redis Adapter** | Plugin Socket.IO que usa Redis pub/sub para sincronizar eventos entre instâncias |
| **RBAC** | Role-Based Access Control — controle de acesso baseado em papéis |
| **CSP** | Content Security Policy — política que limita fontes de conteúdo carregáveis |

---

*— Fim do PRD PECAÊ v1.0.0 —*

*Revisar a cada sprint ou mudanças significativas de requisitos.*  
*Versionar este arquivo no repositório do projeto e manter o changelog atualizado.*
