# M02 - Perfil do Comprador: Documentação de Implementação

## 1. Visão Geral do Módulo

O módulo M02 (Perfil do Comprador) é responsável pela gestão completa do perfil pessoal do comprador na plataforma PECAÊ, incluindo dados básicos, avatar, acesso centralizado ao histórico de favoritos, buscas salvas, conversas de chat e preferências de notificação. Este documento detalha a implementação completa do módulo, abrangendo a arquitetura técnica, os requisitos funcionais, as regras de negócio, os casos de uso, os endpoints da API, o schema do banco de dados, as integrações com serviços externos e as configurações necessárias para o pleno funcionamento do módulo.

A versão atual do módulo é 1.0.0, com status "planned" e prioridade P1, indicando que todas as funcionalidades estão planejadas para implementação na Sprint 2. O módulo faz parte da Epic E01 (Gestão de Contas) e possui dependência direta com o módulo M01 (Autenticação e Cadastro), sendo fundamental para a experiência do comprador na plataforma.

### 1.1 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo SDK 51 + TypeScript + Expo Router |
| Backend | Node.js + NestJS + TypeScript |
| Database | Supabase (PostgreSQL) + Prisma ORM |
| Storage | Supabase Storage (avatar do comprador) |
| Queue | BullMQ (anonimização de dados) |
| Push | Expo Notifications + FCM + APNs |
| Deploy | Vercel (API) + Expo EAS (mobile) |

### 1.2 Descrição do Módulo

Módulo responsável pelo perfil pessoal do comprador: dados básicos, avatar, acesso ao histórico de favoritos, buscas salvas, conversas de chat e preferências de notificação. Perfil simples e centrado na experiência de busca e negociação. O módulo permite que o comprador mantenha suas informações atualizadas, gerencie suas preferências de comunicação e tenha acesso rápido a todas as suas atividades na plataforma.

### 1.3 Objetivos do Módulo

O módulo M02 foi desenvolvido com quatro objetivos principais que guiam toda a sua implementação. O primeiro objetivo é permitir que o comprador visualize e edite seus dados pessoais, incluindo nome, telefone e avatar, de forma intuitiva e segura. O segundo objetivo é centralizar o acesso a favoritos, buscas salvas e histórico de chats, oferecendo uma experiência unificada e organizada para o usuário gerenciar suas atividades na plataforma.

O terceiro objetivo do módulo é gerenciar preferências de notificação por canal, permitindo que o comprador escolha quais tipos de notificações deseja receber, seja por push, e-mail ou in-app. O quarto objetivo é permitir o upload de avatar pessoal, possibilitando que o comprador personalize seu perfil com uma foto que o identifique na plataforma. Esses objetivos garantem que o módulo ofereça uma experiência completa e personalizada para o comprador.

### 1.4 Atores

O módulo M02 envolve dois atores principais que interagem de diferentes formas com as funcionalidades implementadas. O primeiro ator é o Comprador, que utiliza todas as funcionalidades do módulo para gerenciar seu perfil, preferências e atividades na plataforma. O segundo ator é o Sistema, responsável por calcular o histórico de atividade do comprador e executar processos automatizados como a anonimização de dados após a exclusão de conta.

### 1.5 Dependências

O módulo M02 possui dependências específicas que devem ser consideradas durante a implementação. Externamente, o módulo depende do Supabase Storage para armazenar os avatars dos compradores de forma segura e eficiente. Internamente, o módulo depende do M01 (Autenticação e Cadastro) para obter as informações básicas do usuário e garantir que apenas usuários autenticados possam acessar as funcionalidades do perfil. Essa dependência é fundamental pois o BuyerProfile é uma extensão do User base criado no M01.

---

## 2. Fluxo do Módulo

### 2.1 Fluxo BPMN (Texto)

O fluxo de gestão do perfil do comprador segue uma estrutura organizada que envolve múltiplas camadas do sistema. O processo inicia quando o comprador acessa a aba de Perfil no aplicativo móvel, acionando uma série de consultas e renderizações que exibem as informações pessoais e os atalhos para as funcionalidades relacionadas.

```
START EVENT: Comprador acessa aba de Perfil no app
TASK (App): useQuery(['buyer', 'me']) → GET /buyers/me
TASK (App): Renderizar tela de perfil com: avatar, nome, e-mail, telefone
TASK (App): Exibir atalhos: Meus Favoritos, Buscas Salvas, Conversas, Configurações
EXCLUSIVE GATEWAY: Ação do comprador?
  [Editar Perfil] --> TASK (App): Navegar para app/(buyer)/perfil-editar.tsx
                    TASK (Comprador): Editar nome, telefone ou avatar
                    TASK (API): PUT /buyers/me → atualizar BuyerProfile
  [Ver Favoritos] --> TASK (App): Navegar para app/(buyer)/favoritos.tsx
                    TASK (API): GET /favorites → listar anúncios favoritados
  [Ver Buscas Salvas] --> TASK (App): Navegar para app/(buyer)/buscas-salvas.tsx
                        TASK (API): GET /saved-searches
  [Ver Conversas] --> TASK (App): Navegar para app/(tabs)/mensagens.tsx (M06)
  [Configurações] --> TASK (App): Navegar para app/(buyer)/configuracoes.tsx
                    TASK (Comprador): Editar preferências de notificação
                    TASK (API): PUT /notifications/preferences
END EVENT: Ação concluída e perfil atualizado
```

### 2.2 Fluxos de Mensagem

Os fluxos de mensagem definem as comunicações entre os diferentes componentes do sistema durante a execução das funcionalidades do módulo. A API comunica-se com o Supabase Storage para realizar o upload de avatar do comprador através de presigned URLs seguras, garantindo que apenas usuários autenticados possam上传图片到自己的头像。同时，API返回更新后的BuyerProfile信息给应用程序，以便客户端可以立即反映这些变化。

---

## 3. Requisitos Funcionais

Os requisitos funcionais do módulo M02 definem as capacidades que o sistema deve oferecer ao comprador. Cada requisito possui uma prioridade específica que orienta a ordem de implementação das funcionalidades.

| ID | Descrição | Prioridade |
|----|----------|-----------|
| RF10 | Comprador deve poder visualizar seu perfil com nome, e-mail verificado e telefone | P0 |
| RF11 | Comprador deve poder editar nome e telefone | P0 |
| RF12 | Comprador deve poder fazer upload de avatar | P2 |
| RF13 | Comprador deve ter acesso centralizado a favoritos, buscas salvas e conversas | P0 |
| RF14 | Comprador deve poder configurar preferências de notificação por canal (push, e-mail, in-app) | P1 |
| RF15 | Comprador deve poder excluir conta e dados pessoais (LGPD) | P1 |

O requisito RF10 é fundamental pois permite que o comprador visualize suas informações básicas de forma clara e acessível. O RF11 complementa esse requisito ao permitir edições quando necessário. O RF12 adiciona a capacidade de personalização visual do perfil. O RF13 é crucial para a experiência do usuário ao centralizar todas as atividades em um único local. O RF14 e RF15 são requisitos importantes para a conformidade com as preferências do usuário e com a legislação de proteção de dados.

---

## 4. Regras de Negócio

As regras de negócio estabelecem constraints e comportamentos específicos que devem ser seguidos durante a implementação do módulo. Essas regras garantem a consistência dos dados e a conformidade com as políticas da plataforma e com a legislação aplicável.

| ID | Descrição |
|----|----------|
| RN07 | Comprador responsável pela veracidade de seus dados pessoais |
| RN-M02-01 | E-mail do comprador só pode ser alterado mediante reverificação via link enviado ao novo e-mail |
| RN-M02-02 | Exclusão de conta é soft delete: User.status = DELETED, dados pessoais anonimizados após 30 dias (LGPD) |
| RN-M02-03 | Comprador pode ter múltiplas buscas salvas, mas máximo 10 ativas simultaneamente |

A regra RN07 estabelece a responsabilidade do comprador sobre as informações fornecidas, isentando a plataforma de responsabilidades sobre dados incorretos. A regra RN-M02-01 é uma medida de segurança importante que impede alterações não autorizadas de e-mail sem verificação. A regra RN-M02-02 é fundamental para a conformidade com a LGPD, garantindo que os dados dos usuários sejam tratados de acordo com a legislação. A regra RN-M02-03 estabelece um limite para evitar o abuso da funcionalidade de buscas salvas.

---

## 5. Casos de Uso

### 5.1 UC05 - Visualizar e Editar Perfil Pessoal

**Atores:** Comprador

**Pré-condições:** Comprador autenticado com status ACTIVE

**Fluxo Principal:**
1. Comprador acessa aba Perfil no app
2. Visualiza dados pessoais e estatísticas de uso
3. Toca em 'Editar Perfil'
4. Edita campos desejados
5. Salva alterações

**Fluxos Alternativos:**
- A1. E-mail: exibido como somente leitura com botão 'Alterar E-mail' que inicia fluxo de reverificação

**Pós-condições:** BuyerProfile atualizado

Este caso de uso permite que o comprador mantenha suas informações pessoais atualizadas na plataforma. A implementação deve garantir que apenas campos autorizados possam ser editados, protegendo informações sensíveis como o e-mail que requer um fluxo separado de verificação.

---

### 5.2 UC06 - Gerenciar Preferências de Notificação

**Atores:** Comprador

**Pré-condições:** Comprador autenticado

**Fluxo Principal:**
1. Comprador acessa Configurações de Notificação
2. Ativa/desativa canais: push, e-mail, in-app
3. Sistema salva preferências
4. M11 usa preferências ao enviar notificações

**Fluxos Alternativos:** Nenhum

**Pós-condições:** Preferências de notificação salvas e respeitadas pelo M11

Este caso de uso permite que o comprador tenha controle total sobre quais canais de notificação deseja receber. A implementação deve garantir que essas preferências sejam respeitadas por todos os módulos que enviam notificações, especialmente o M11.

---

### 5.3 UC07 - Excluir Conta (LGPD)

**Atores:** Comprador

**Pré-condições:** Comprador autenticado

**Fluxo Principal:**
1. Comprador acessa 'Excluir Conta' nas configurações
2. Confirma com senha atual
3. Sistema realiza soft delete e agenda anonimização
4. Todos os refresh tokens revogados

**Fluxos Alternativos:**
- A1. Vendedor: deve encerrar anúncios ativos antes de excluir conta

**Pós-condições:** Conta soft-deleted, dados agendados para anonimização em 30 dias, sessão encerrada

Este caso de uso é fundamental para a conformidade com a LGPD, permitindo que o usuário exerça seu direito ao esquecimento. A implementação deve garantir que o processo seja seguro, exigindo confirmação de senha, e que os dados sejam properly anonimizados após o período determinado.

---

## 6. Tarefas e Subtarefas Implementadas

### 6.1 M02-T01: Schema Prisma — BuyerProfile e NotificationPreferences

**Status:** planned | **Prioridade:** P0 | **Dias Estimados:** 1

**Descrição:** Criar model BuyerProfile (dados pessoais do comprador além do User base) e NotificationPreferences (preferências por canal) no Prisma. Garantir relação 1:1 com User. Esta tarefa é fundamental pois estabelece a estrutura de dados que armazenará todas as informações específicas do comprador, permitindo uma separação clara entre dados de identidade (gerenciados pelo M01) e dados de perfil do comprador.

**Subtarefas:**

#### M02-T01-ST01: Escrever model BuyerProfile no Prisma

**Status:** planned | **Horas Estimadas:** 2

Adicionar model BuyerProfile ao schema.prisma com: id (UUID), userId (FK @unique → User), name (String), avatar (String?), createdAt, updatedAt. Criar também NotificationPreferences (id, userId @unique, pushEnabled Boolean @default(true), emailEnabled Boolean @default(true), inAppEnabled Boolean @default(true)).

**Critérios de Aceitação:**
- BuyerProfile.userId @unique (1:1 com User)
- NotificationPreferences com defaults true para todos os canais
- Migration executada sem erros

**Notas Técnicas:** model BuyerProfile: `@@map('buyer_profile')`. model NotificationPreferences: `@@map('notification_preferences')`. onDelete: Cascade nas relações (se User deletado, profiles removidos). NotificationPreferences criada automaticamente ao criar BuyerProfile via service. Adicionar relações inversas no model User: `buyerProfile BuyerProfile?` e `notificationPreferences NotificationPreferences?`.

---

#### M02-T01-ST02: Migration e criação automática de BuyerProfile no registro

**Status:** planned | **Horas Estimadas:** 2

Executar migration das entidades do comprador. Modificar AuthService.register() para criar BuyerProfile e NotificationPreferences automaticamente em transaction ao criar User com type BUYER ou BOTH.

**Critérios de Aceitação:**
- Migration aplicada no Supabase
- Registro de novo BUYER cria BuyerProfile automaticamente
- NotificationPreferences criadas com pushEnabled=true, emailEnabled=true, inAppEnabled=true
- Transaction garante seja tudo criado ou nada

**Notas Técnicas:** No AuthService.register(): expandir `prisma.$transaction([createUser, ...])` para incluir `prisma.buyerProfile.create()` e `prisma.notificationPreferences.create()` condicionais ao tipo. Para SELLER sem BOTH: criar apenas SellerProfile no M03. Para BOTH: criar buyer E seller profiles.

---

#### M02-T01-ST03: Implementar BuyerController com endpoints GET e PUT /buyers/me

**Status:** planned | **Horas Estimadas:** 3

Criar BuyerModule com BuyerController e BuyerService. Endpoints: GET /buyers/me (retorna perfil completo incluindo notificationPreferences) e PUT /buyers/me (atualiza name e avatar). Protegidos com JwtAuthGuard.

**Critérios de Aceitação:**
- GET /buyers/me retorna 200 com perfil completo
- PUT /buyers/me aceita apenas name e avatar (whitelist via DTO)
- E-mail não pode ser alterado via este endpoint
- passwordHash nunca incluído na resposta

**Notas Técnicas:** BuyerService.getMyProfile(): `prisma.user.findUnique({ where: { id: userId }, include: { buyerProfile: true, notificationPreferences: true }, select: { id: true, email: true, emailVerified: true, buyerProfile: true, notificationPreferences: true } })`. DTO UpdateBuyerDto: `@IsOptional() @IsString() @MinLength(2) name`, `@IsOptional() @IsUrl() avatar`. Nunca incluir passwordHash via `select`.

---

### 6.2 M02-T02: Telas de perfil do comprador no app

**Status:** planned | **Prioridade:** P0 | **Dias Estimados:** 2

**Descrição:** Implementar telas app/(buyer)/perfil.tsx e app/(buyer)/perfil-editar.tsx com React Hook Form + Zod. Tela principal exibe dados pessoais e atalhos para favoritos, buscas salvas e conversas. Tela de edição permite alterar nome e avatar.

**Subtarefas:**

#### M02-T02-ST01: Tela app/(buyer)/perfil.tsx — visão principal do comprador

**Status:** planned | **Horas Estimadas:** 4

Criar tela principal de perfil do comprador com: header com avatar e informações básicas, badges de verificação de e-mail e telefone, grade de atalhos com contadores (Favoritos, Buscas Salvas, Conversas), e menu de configurações.

**Critérios de Aceitação:**
- Avatar com placeholder de initials quando sem foto
- Ícones de verificação em verde quando verificados
- Grade de atalhos com contadores reais
- Botão Sair chama POST /auth/logout e limpa SecureStore

**Notas Técnicas:** Avatar: componente AvatarImage com fallback: `user.avatar ? <Image src={avatar} /> : <View><Text>{initials}</Text></View>`. Contadores: `useQuery(['favorites', 'count'])`, `useQuery(['saved-searches', 'count'])`, `useQuery(['chats', 'unread-count'])`. Grade: `FlatList` com `numColumns={2}` ou componente de Grid. Logout: `useMutation(authApi.logout, { onSuccess: () => { secureStore.clear(); router.replace('/(auth)/login') } })`.

---

#### M02-T02-ST02: Tela de edição de perfil e upload de avatar

**Status:** planned | **Horas Estimadas:** 3

Criar tela app/(buyer)/perfil-editar.tsx com formulário React Hook Form para edição de nome. Implementar fluxo de upload de avatar via expo-image-picker e presigned URL do Supabase Storage. Bug comum: validar que nome tenha ao menos 2 caracteres.

**Critérios de Aceitação:**
- Formulário rejeita nome com menos de 2 caracteres
- Avatar preview imediato após seleção (antes do upload)
- Imagem redimensionada para 200x200px no app antes do upload
- Loading state durante upload do avatar

**Notas Técnicas:** expo-image-picker: `ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: false })`. Redimensionar: `expo-image-manipulator` com `resize({ width: 200, height: 200 })`. Upload: mesmo padrão de presigned URL do M03 (logo do vendedor). Supabase bucket: 'buyer-avatars' público para leitura. Path: `buyers/{userId}/avatar.jpg`. Após upload, invalidar query ['buyer', 'me'].

---

#### M02-T02-ST03: Tela de configurações de notificação do comprador

**Status:** planned | **Horas Estimadas:** 2

Criar tela app/(buyer)/configuracoes.tsx com toggles para preferências de notificação (push, e-mail, in-app). Integrar com PUT /notifications/preferences. Solicitar permissão de push caso necessário via Expo Notifications.

**Critérios de Aceitação:**
- Toggles refletem estado atual das preferências carregadas da API
- Ao ativar push: solicitar permissão do sistema operacional
- Alterações salvas automaticamente ao mudar toggle (debounce 500ms)
- Feedback visual de erro se API falhar ao salvar

**Notas Técnicas:** Expo Notifications: `await Notifications.requestPermissionsAsync()`. Checar: `const { status } = await Notifications.getPermissionsAsync()`. Se status !== 'granted': mostrar Alert nativo com instrução para abrir configurações. Switch: componente Switch do React Native com trackColor e thumbColor customizados. Debounce: `useCallback` com `setTimeout` de 500ms antes de chamar a mutation. Integrar com NotificationModule (M11) que usa essas preferências ao enviar.

---

### 6.3 M02-T03: Favoritos e buscas salvas do comprador

**Status:** planned | **Prioridade:** P1 | **Dias Estimados:** 2

**Descrição:** Implementar funcionalidade de favoritar anúncios (Favorite) e salvar buscas (SavedSearch) no perfil do comprador. Endpoints: POST/DELETE /favorites/:listingId, GET /favorites, POST /saved-searches, GET /saved-searches, DELETE /saved-searches/:id. Telas de listagem no app.

**Subtarefas:**

#### M02-T03-ST01: Implementar endpoints de favoritos (Favorite CRUD)

**Status:** planned | **Horas Estimadas:** 3

Criar FavoritesController com: POST /favorites/:listingId (favoritar), DELETE /favorites/:listingId (desfavoritar), GET /favorites (listar com dados do anúncio). Usar upsert ou verificação de existência para toggle. Retornar lista com dados completos do listing incluindo veículo e foto.

**Critérios de Aceitação:**
- POST /favorites retorna 201 com favorited:true
- DELETE /favorites retorna 200 com favorited:false
- GET /favorites retorna anúncios com thumbnail, título e localização
- Anúncio não encontrado ou não PUBLISHED retorna 404

**Notas Técnicas:** GET /favorites: `prisma.favorite.findMany({ where: { userId }, include: { listing: { include: { vehicle: { include: { photos: { take: 1, orderBy: { order: 'asc' } }, version: { include: { model: { include: { brand: true } } } } } } } } }, orderBy: { createdAt: 'desc' } })`. Toggle: usar `prisma.favorite.deleteMany({ where: { userId, listingId } })` e verificar count para determinar se foi removido. TanStack Query optimistic update: `useMutation({ onMutate: (listingId) => { queryClient.setQueryData([...], updater) }, onError: rollback })`.

---

#### M02-T03-ST02: Implementar endpoints de buscas salvas (SavedSearch)

**Status:** planned | **Horas Estimadas:** 3

Criar SavedSearchController com: POST /saved-searches (salvar busca atual com filtros como JSON), GET /saved-searches (listar), DELETE /saved-searches/:id. PATCH /saved-searches/:id/alert (ativar/desativar alerta). Validar máximo de 10 buscas salvas por comprador.

**Critérios de Aceitação:**
- POST /saved-searches com 10 existentes retorna 422
- filters armazenado como JSON válido com campos: brandId, modelId, city, state, yearMin, yearMax
- alertActive default false na criação
- PATCH /:id/alert toggle o campo alertActive

**Notas Técnicas:** SavedSearch.filters: `Json` type no Prisma, armazenar como: `{ brandId?: string, modelId?: string, versionId?: string, yearMin?: number, yearMax?: number, city?: string, state?: string, q?: string }`. CreateSavedSearchDto: `@IsString() @IsOptional() query`, `@IsObject() filters`, `@IsBoolean() @IsOptional() alertActive`. O job de alertas (M_favoritos_alertas) usa esses filtros para matching com novos anúncios.

---

#### M02-T03-ST03: Telas de favoritos e buscas salvas no app

**Status:** planned | **Horas Estimadas:** 4

Criar telas app/(buyer)/favoritos.tsx (lista de anúncios favoritados com FlashList) e app/(buyer)/buscas-salvas.tsx (lista de buscas com filtros resumidos, toggle de alerta e botão de repetir busca). Ambas com swipe to delete e empty states.

**Critérios de Aceitação:**
- FlashList com estimatedItemSize=150 para ListingCard
- Swipe to delete com confirmação via Alert nativo
- Empty state com imagem e CTA atraente
- Pull to refresh com RefreshControl
- Tela de buscas: botão 'Repetir busca' navega para busca com filtros pré-preenchidos

**Notas Técnicas:** FlashList: `@shopify/flash-list`. Swipe: `react-native-swipeable` ou `react-native-gesture-handler` GestureDetector com Swipeable. Empty state: componente EmptyState reutilizável com SVG ilustrativo. Repetir busca: `router.push({ pathname: '/(tabs)/busca', params: { brandId, modelId, city, state } })`. Toggle alerta: switch inline no card de busca salva com useMutation PATCH.

---

### 6.4 M02-T04: Exclusão de conta e conformidade LGPD

**Status:** planned | **Prioridade:** P1 | **Dias Estimados:** 1

**Descrição:** Implementar fluxo de exclusão de conta para o comprador com soft delete, revogação de tokens, e agendamento de anonimização via BullMQ após 30 dias. Garantir conformidade com a LGPD (Lei 13.709/2018).

**Subtarefas:**

#### M02-T04-ST01: Endpoint DELETE /buyers/me e soft delete

**Status:** planned | **Horas Estimadas:** 3

Implementar DELETE /buyers/me que verifica senha, realiza soft delete do User (status=DELETED, deletedAt=now()), revoga todos os refresh tokens e agenda job de anonimização via BullMQ com delay de 30 dias.

**Critérios de Aceitação:**
- Senha incorreta retorna 401
- User.status=DELETED e deletedAt=now() em transaction com revogação de tokens
- Job BullMQ com delay de 30 dias agendado com sucesso
- Endpoint protegido com JwtAuthGuard

**Notas Técnicas:** Job 'anonymize-user': `{ userId }` com delay: `30 * 24 * 60 * 60 * 1000` ms. Worker processa: `prisma.user.update({ where: { id }, data: { email: anon-${userId}@deleted.pecae.com, name: 'Usuário Removido', phone: null, avatar: null } })`. Soft delete não remove dados de AuditLog (manter para conformidade). Considerar email do User na constraint @unique: adicionar campo separado `originalEmail String?` para manter rastreabilidade pós-anonimização.

---

#### M02-T04-ST02: Tela de exclusão de conta no app

**Status:** planned | **Horas Estimadas:** 2

Criar fluxo de exclusão de conta no app: item de menu 'Excluir Conta' em configurações, tela de confirmação com aviso sobre dados (favoritos, conversas, histórico), input de senha atual, botão de confirmação com texto 'Excluir minha conta definitivamente'.

**Critérios de Aceitação:**
- Dois passos de confirmação (modal de aviso + input de senha)
- Botão de exclusão em vermelho com texto explícito
- Erro de senha incorreta exibido inline
- Loading state durante chamada à API

**Notas Técnicas:** Tela: `app/(buyer)/excluir-conta.tsx`. Botão vermelho: `backgroundColor: '#EF4444'`. Texto do botão: 'Excluir minha conta definitivamente'. Input de senha com `secureTextEntry`. useMutation com onSuccess: `await SecureStore.deleteItemAsync('access_token'); await SecureStore.deleteItemAsync('refresh_token'); router.replace('/(auth)/login')`. Zustand clearAuth() chamado também para limpar estado global.

---

#### M02-T04-ST03: Worker BullMQ para anonimização de dados de usuários excluídos

**Status:** planned | **Horas Estimadas:** 3

Implementar worker BullMQ para o job 'anonymize-user' que anonimiza dados pessoais do usuário após 30 dias da exclusão. Anonimizar: email, name, phone, avatar no User e BuyerProfile. Registrar ação no AuditLog. Garantir idempotência do job.

**Critérios de Aceitação:**
- Job idempotente: verificar User.status antes de anonimizar
- Transaction garante atomicidade da anonimização
- AuditLog registra ação de anonimização com timestamp
- Job com retry em caso de falha (maxAttempts 5, backoff exponencial)
- Dados de ChatMessage e Report mantidos (apenas campos globais anonimizados)

**Notas Técnicas:** BullMQ Worker: `@Processor('user-management') @Process('anonymize-user') async anonymize(job: Job<{ userId: string }>) { ... }`. Idempotência: `const user = await prisma.user.findUnique({ where: { id: userId } }); if (user.status !== 'DELETED') return;`. AuditLog actor: usar ID de sistema fictício ou null para actorId quando ação é automatizada. Considerar manter ChatRoom/ChatMessage com userId existente mas dados do User anonimizados (comprador aparece como 'Usuário Removido' no histórico).

---

## 7. Schema do Banco de Dados

### 7.1 Modelos

#### BuyerProfile

O modelo BuyerProfile armazena informações específicas do comprador que complementam os dados de identidade do User base. Este modelo foi separado do User para manter uma arquitetura modular onde o M01 gerencia identidade e autenticação enquanto o M02 gerencia o perfil do comprador.

```prisma
model BuyerProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  name      String
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map('buyer_profile')
}
```

#### NotificationPreferences

O modelo NotificationPreferences armazena as preferências de notificação do comprador por canal. Cada comprador possui exatamente um conjunto de preferências, permitindo que o módulo M11 (Notificações) respeite as escolhas do usuário ao enviar notificações.

```prisma
model NotificationPreferences {
  id            String  @id @default(uuid())
  userId        String  @unique
  pushEnabled   Boolean @default(true)
  emailEnabled  Boolean @default(true)
  inAppEnabled  Boolean @default(true)
  user          User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map('notification_preferences')
}
```

#### Favorite

O modelo Favorite representa a relação entre um comprador e os anúncios que ele favoritou. Este modelo permite que o comprador salve anúncios de interesse para acesso posterior.

```prisma
model Favorite {
  id        String   @id @default(uuid())
  userId    String
  listingId String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId])
}
```

#### SavedSearch

O modelo SavedSearch armazena as buscas salvas pelo comprador com seus respectivos filtros. Quando um novo anúncio é publicado, o sistema pode verificar se ele corresponde a alguma busca salva com alerta ativo e notificar o comprador.

```prisma
model SavedSearch {
  id          String   @id @default(uuid())
  userId      String
  query       String?
  filters     Json
  alertActive Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map('saved_search')
}
```

### 7.2 Alterações no Model User

O modelo User, originalmente definido no M01, deve receber as relações para os novos modelos criados no M02. Estas relações permitem navegar entre os dados de identidade e o perfil do comprador.

```prisma
model User {
  // ... campos existentes do M01 ...
  
  buyerProfile            BuyerProfile?
  notificationPreferences NotificationPreferences?
  favorites               Favorite[]
  savedSearches           SavedSearch[]
}
```

---

## 8. Endpoints da API

### 8.1 Perfil do Comprador

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /buyers/me | Retorna perfil completo do comprador autenticado | JWT |
| PUT | /buyers/me | Atualiza nome e avatar do comprador | JWT |
| POST | /buyers/me/avatar | Inicia upload de avatar (presigned URL) | JWT |
| POST | /buyers/me/avatar/confirm | Confirma upload de avatar | JWT |
| DELETE | /buyers/me | Exclui conta (soft delete + LGPD) | JWT |

### 8.2 Favoritos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /favorites | Lista todos os favoritos do comprador | JWT |
| POST | /favorites/:listingId | Adiciona anúncio aos favoritos | JWT |
| DELETE | /favorites/:listingId | Remove anúncio dos favoritos | JWT |

### 8.3 Buscas Salvas

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /saved-searches | Lista todas as buscas salvas | JWT |
| POST | /saved-searches | Cria nova busca salva | JWT |
| DELETE | /saved-searches/:id | Remove busca salva | JWT |
| PATCH | /saved-searches/:id/alert | Ativa/desativa alerta da busca | JWT |

### 8.4 Preferências de Notificação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /notifications/preferences | Retorna preferências de notificação | JWT |
| PUT | /notifications/preferences | Atualiza preferências de notificação | JWT |

---

## 9. Configurações do Módulo

### 9.1 Configurações do Supabase Storage

O módulo M02 utiliza o Supabase Storage para armazenar os avatars dos compradores. A configuração adequada do bucket é essencial para o funcionamento correto do upload de imagens.

**Criação do Bucket:**
- Nome: `buyer-avatars`
- Tipo: `public` (leitura pública)
- Tamanho máximo do arquivo: 2MB
- Tipos de arquivo permitidos: image/jpeg, image/png, image/webp

**Configuração de Políticas (RLS):**
- Usuários autenticados podem fazer upload de avatar apenas para seu próprio path
- Path pattern: `buyers/{userId}/avatar.jpg`
- Todos podem ler avatars (público)

### 9.2 Configurações do BullMQ

O módulo M02 utiliza o BullMQ para agendar jobs de anonimização de dados. A configuração adequada da fila garante que os dados sejam anonimizados corretamente após 30 dias da exclusão de conta.

**Configuração da Fila:**
- Nome da fila: `user-management`
- Tipo de job: `anonymize-user`
- Delay: 30 dias (30 * 24 * 60 * 60 * 1000 ms)
- Retry: máximo 5 tentativas com backoff exponencial

### 9.3 Configurações do Expo Notifications

O módulo M02 requer configuração do Expo Notifications para permitir que o comprador receba notificações push. A implementação deve solicitar permissão adequadamente e tratar casos onde a permissão é negada.

**Solicitação de Permissão:**
- Usar `Notifications.requestPermissionsAsync()` ao ativar push
- Verificar status com `Notifications.getPermissionsAsync()`
- Orientar usuário para configurações do SO se permissão negada

### 9.4 Variáveis de Ambiente

#### Backend (NestJS)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| SUPABASE_STORAGE_BUCKET_AVATARS | Nome do bucket de avatars | Sim |
| SUPABASE_SERVICE_ROLE_KEY | Chave de serviço do Supabase para operações admin | Sim |
| BULLMQ_QUEUE_NAME | Nome da fila BullMQ (padrão: user-management) | Sim |

#### Frontend (Expo)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| EXPO_PUBLIC_SUPABASE_URL | URL do projeto Supabase | Sim |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Chave anônima do Supabase | Sim |

---

## 10. Estrutura de Arquivos

### 10.1 Backend (NestJS)

```
src/
├── prisma/
│   └── schema.prisma
├── buyers/
│   ├── buyers.module.ts
│   ├── buyers.controller.ts
│   ├── buyers.service.ts
│   └── dto/
│       ├── update-buyer.dto.ts
│       ├── avatar-upload.dto.ts
│       └── delete-account.dto.ts
├── favorites/
│   ├── favorites.module.ts
│   ├── favorites.controller.ts
│   └── favorites.service.ts
├── saved-searches/
│   ├── saved-searches.module.ts
│   ├── saved-searches.controller.ts
│   ├── saved-searches.service.ts
│   └── dto/
│       ├── create-saved-search.dto.ts
│       └── update-saved-search.dto.ts
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── dto/
│       └── update-preferences.dto.ts
└── processors/
    └── user-management.processor.ts
```

### 10.2 Frontend (Expo)

```
app/
├── (buyer)/
│   ├── _layout.tsx
│   ├── perfil.tsx
│   ├── perfil-editar.tsx
│   ├── favoritos.tsx
│   ├── buscas-salvas.tsx
│   ├── configuracoes.tsx
│   └── excluir-conta.tsx
src/
├── api/
│   ├── buyer.ts
│   ├── favorites.ts
│   ├── saved-searches.ts
│   └── notifications.ts
├── components/
│   ├── AvatarImage.tsx
│   ├── FavoriteCard.tsx
│   ├── SavedSearchCard.tsx
│   ├── NotificationToggle.tsx
│   └── EmptyState.tsx
└── hooks/
    ├── use-buyer.ts
    ├── use-favorites.ts
    └── use-notifications.ts
```

---

## 11. Integrações com Outros Módulos

### 11.1 Integração com M01 (Autenticação e Cadastro)

O módulo M02 depende fortemente do M01 para funcionar corretamente. A integração envolve a criação automática de BuyerProfile e NotificationPreferences quando um novo usuário do tipo BUYER ou BOTH é criado no M01. O AuthService.register() deve ser modificado para incluir essa lógica transacional.

### 11.2 Integração com M06 (Mensagens)

A tela de conversas no perfil do comprador navega para o módulo M06 (Mensagens). O contador de mensagens não lidas deve ser obtido a partir dos dados do M06, ou através de um endpoint agregado no M02.

### 11.3 Integração com M11 (Notificações)

O módulo M02 fornece as preferências de notificação que o M11 deve respeitar ao enviar notificações. O M11 deve consultar as NotificationPreferences do destinatário antes de enviar qualquer notificação, verificando se o canal está habilitado.

### 11.4 Integração com M_favoritos_alertas (Job de Alertas)

O SavedSearch com alertActive=true deve ser monitorado pelo job de alertas. Quando um novo anúncio é publicado, o job deve verificar se ele corresponde a alguma busca salva ativa e notificar o comprador.

---

## 12. Considerações de Segurança

### 12.1 Proteção de Dados Pessoais

O módulo M02 lida com dados pessoais sensíveis que devem ser protegidos adequadamente. O avatar do comprador é armazenado no Supabase Storage, que possui suas próprias políticas de segurança. O nome e telefone são dados que devem ser transmitidos apenas através de conexões seguras (HTTPS).

### 12.2 Verificação de Senha para Ações Críticas

A exclusão de conta (UC07) requer verificação de senha para garantir que a ação foi intenção do titular da conta. A senha deve ser verificada usando bcrypt.compare no backend antes de executar qualquer modificação no status do usuário.

### 12.3 Anonimização de Dados

O processo de anonimização de dados deve garantir que todas as informações pessoais sejam removidas ou substituídas de forma irreversível. Os dados anonimizados incluem: e-mail, nome, telefone e avatar. O AuditLog deve registrar essa ação para fins de conformidade.

### 12.4 Rate Limiting

Endpoints sensíveis como DELETE /buyers/me devem ter rate limiting para evitar ataques de força bruta. Recomenda-se usar o Redis Upstash já configurado no M01 para essa finalidade.

---

## 13. Testes e Qualidade

### 13.1 Testes Unitários

Cada serviço do módulo M02 deve ter testes unitários abrangentes que cubram os casos de uso principais. Os testes devem incluir: criação e atualização de BuyerProfile, toggle de favoritos, CRUD de buscas salvas, e exclusão de conta.

### 13.2 Testes de Integração

Os endpoints da API devem ser testados em conjunto com o banco de dados para garantir que as operações transacionais funcionam corretamente, especialmente a criação automática de BuyerProfile no registro.

### 13.3 Testes E2E

Os fluxos de usuário no app devem ser testados abrangendo: visualização e edição de perfil, upload de avatar, favoritar/desfavoritar anúncios, salvar/buscar buscas, configurar notificações, e excluir conta.

---

## 14. Checklist de Implementação

### Backend (NestJS)
- [ ] Criar models BuyerProfile, NotificationPreferences, Favorite, SavedSearch no schema.prisma
- [ ] Executar migration no Supabase
- [ ] Implementar BuyerController com GET/PUT /buyers/me
- [ ] Implementar FavoritesController com CRUD completo
- [ ] Implementar SavedSearchController com validação de limite (10)
- [ ] Implementar NotificationsController para preferências
- [ ] Implementar DELETE /buyers/me com soft delete
- [ ] Configurar BullMQ worker para anonimização
- [ ] Modificar AuthService.register() para criar BuyerProfile automaticamente

### Frontend (Expo)
- [ ] Criar tela app/(buyer)/perfil.tsx
- [ ] Criar tela app/(buyer)/perfil-editar.tsx
- [ ] Implementar upload de avatar com expo-image-picker
- [ ] Criar tela app/(buyer)/favoritos.tsx
- [ ] Criar tela app/(buyer)/buscas-salvas.tsx
- [ ] Criar tela app/(buyer)/configuracoes.tsx
- [ ] Criar tela app/(buyer)/excluir-conta.tsx
- [ ] Implementar contadores de favoritos, buscas e mensagens

### Configurações
- [ ] Configurar bucket buyer-avatars no Supabase Storage
- [ ] Configurar políticas RLS para o bucket
- [ ] Configurar fila BullMQ para anonimização
- [ ] Configurar variáveis de ambiente necessárias

---

## 15. Glossário

- **BuyerProfile**: Entidade que armazena dados específicos do comprador, como nome e avatar
- **NotificationPreferences**: Entidade que armazena as preferências de notificação por canal
- **Favorite**: Relação entre comprador e anúncio favoritado
- **SavedSearch**: Busca salva com filtros e status de alerta
- **Soft Delete**: Técnica de exclusão que marca o registro como deletado sem removê-lo fisicamente
- **Anonimização**: Processo de remoção irreversível de dados pessoais
- **Presigned URL**: URL temporária para upload direto ao storage
- **LGPD**: Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018)
