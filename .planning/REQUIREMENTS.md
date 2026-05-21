# REQUIREMENTS.md

## Requisitos Funcionais por Módulo

### M01 - Autenticação e Cadastro

> [!NOTE]
> Os requisitos funcionais deste módulo foram 100% satisfeitos e arquivados em [v1.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v1.0-REQUIREMENTS.md).

### M02 - Perfil do Comprador

> [!NOTE]
> Os requisitos funcionais deste módulo foram 100% satisfeitos e arquivados em [v2.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v2.0-REQUIREMENTS.md).

### M03 - Perfil do Vendedor

> [!NOTE]
> Os requisitos funcionais deste módulo foram 100% satisfeitos e arquivados em [v2.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v2.0-REQUIREMENTS.md).

### M04 - Catálogo Automotivo

> [!NOTE]
> Os requisitos funcionais deste módulo foram 100% satisfeitos e arquivados em [v1.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v1.0-REQUIREMENTS.md).

### M05 - Cadastro de Sucata / Veículo

> [!NOTE]
> Os requisitos funcionais deste módulo foram 100% satisfeitos e arquivados em [v3.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v3.0-REQUIREMENTS.md).

### M06 - Avaliações e Reputação
- **RF70:** Comprador deve poder avaliar vendedor com nota 1-5 e comentário opcional após interação em chat (P1)
- **RF71:** Sistema deve calcular e exibir rating médio no perfil público do vendedor (P1)
- **RF72:** Sistema deve exibir histórico de avaliações recebidas no perfil do vendedor (P1)
- **RF73:** Apenas uma avaliação por chatRoom (uma negociação = uma avaliação) (P0)

### M07 - Busca e Descoberta
- **RF50:** Sistema deve permitir busca de sucatas por marca, modelo e faixa de ano (P0)
- **RF51:** Sistema deve filtrar resultados por cidade e/ou estado (P0)
- **RF52:** Sistema deve suportar busca por texto livre (nome de peça) com debounce de 300ms (P1)
- **RF53:** Resultados devem ser paginados via cursor (não offset) para performance (P0)
- **RF54:** Sistema deve exibir autocomplete de marca e modelo no campo de texto (P1)
- **RF55:** Tela de detalhe do anúncio deve exibir galeria de fotos, peças disponíveis (sem preços) e dados do vendedor (P0)
- **RF56:** Sistema deve sugerir 'Salvar busca' quando resultados retornam zero (P1)
- **RF57:** Busca deve retornar exclusivamente sucatas (veículos completos) com status PUBLISHED (P0)

### M08 - Chat e Negociação
- **RF60:** Comprador deve poder iniciar chat a partir de anúncio PUBLISHED (uma sala por comprador por anúncio) (P0)
- **RF61:** Mensagens devem ser entregues em tempo real via Supabase Realtime (P0)
- **RF62:** Histórico de mensagens deve ser persistido no banco com paginação cursor (P0)
- **RF63:** Usuários devem receber push notification de novas mensagens quando o app estiver em background (P0)
- **RF64:** Comprador deve visualizar lista de todas as suas conversas ativas na aba Mensagens (P0)
- **RF65:** Vendedor deve visualizar lista de todas as conversas ativas nos seus anúncios na aba Mensagens (P0)
- **RF66:** Sistema deve exibir contador de mensagens não lidas por conversa (P0)

### M09 - Painel de Moderação
- **RF100:** Moderador deve visualizar fila de anúncios PENDING_APPROVAL com filtros por data, vendedor e tipo de veículo (P0)
- **RF101:** Moderador deve poder aprovar anúncio com nota opcional (P0)
- **RF102:** Moderador deve poder rejeitar anúncio com motivo obrigatório (exibido ao vendedor) (P0)
- **RF103:** Moderador deve revisar documentos de verificação de vendedores (Selo Verificado) (P0)
- **RF104:** Moderador deve poder ver e gerenciar denúncias de anúncios e reviews (P1)
- **RF105:** Admin deve poder suspender ou banir usuários (soft ban) (P1)

### M10 - Gestão de Assinaturas
- **RF110:** Sistema deve exibir tela de planos com preços, features e botão de upgrade (P1)
- **RF111:** Sistema deve criar checkout Mercado Pago e retornar URL para WebView (P1)
- **RF112:** Sistema deve processar webhooks do Mercado Pago e atualizar status de assinatura (P1)
- **RF113:** Sistema deve bloquear cadastro de novos anúncios quando quota do plano atingida (M05) (P0)
- **RF114:** Vendedor deve poder cancelar assinatura e downgrade para GRATUITO (P1)

### M11 - Notificações
- **RF90:** Sistema deve persistir todas as notificações no banco (histórico in-app) (P0)
- **RF91:** Sistema deve enviar push notifications via Expo API para notificações críticas (P0)
- **RF92:** Sistema deve enviar e-mails via Resend API para eventos críticos (aprovação de anúncio, verificação) (P1)
- **RF93:** App deve exibir central de notificações com histórico e marcar como lida (P0)
- **RF94:** Sistema deve respeitar preferências de canal do usuário (M02) (P0)
- **RF95:** Tab de notificações deve exibir badge com contagem de não lidas (P0)

### M12 - Analytics e Dashboard
- **RF120:** Vendedor deve ver dashboard com views, chats iniciados e rating médio dos seus anúncios (P2)
- **RF121:** Vendedor deve ver gráfico de evolução de views dos últimos 30 dias por anúncio (P2)
- **RF122:** Admin deve ver dashboard com DAU, novos cadastros, volume de anúncios e receita de assinaturas (P2)
- **RF123:** Métricas devem ser atualizadas a cada 6 horas via BullMQ cron (não real-time) (P2)

### M13 - Anúncios e Publicidade In-App
- **RF130:** App deve inicializar Google AdMob SDK com consentimento CMP conforme LGPD antes de exibir anúncios (P0)
- **RF131:** BannerAd AdMob deve ser exibido no rodapé das telas de busca e de detalhes de anúncio (P1)
- **RF132:** InterstitialAd AdMob deve ser exibido em transições estratégicas com frequência capping de 30 minutos (P1)
- **RF133:** Sistema deve suportar criação de campanhas de Sponsored Listing pelo Admin com targeting por marca, cidade e estado (P0)
- **RF134:** Sponsored Listings devem aparecer no topo dos resultados de busca com badge 'Patrocinado' visualmente diferenciado (P0)
- **RF135:** Sistema deve registrar impressões e cliques de Sponsored Listings de forma assíncrona via BullMQ (P0)
- **RF136:** Campanhas expiradas devem ser automaticamente desativadas via BullMQ cron diário (P0)
- **RF137:** Admin deve ter painel de gestão de campanhas com metrics de CTR, impressões e cliques (P1)
- **RF138:** App deve implementar frequência capping local (AsyncStorage) para intersticiais AdMob (P1)

### M_favoritos_alertas - Favoritos e Alertas de Busca
- **RF80:** Sistema deve verificar SavedSearches com alertActive=true ao publicar novo anúncio e notificar compradores com match (P1)
- **RF81:** Comprador deve poder ativar/desativar alerta de uma busca salva (P1)
- **RF82:** Sistema deve exibir lista de favoritos com opção de remover e acessar o anúncio (P0)
- **RF83:** Alerta deve especificar nome do veículo e localização compatíveis com os filtros da busca salva (P1)

## Regras de Negócio por Módulo

### M01 - Autenticação e Cadastro

> [!NOTE]
> As regras de negócio deste módulo foram 100% satisfeitas e arquivadas em [v1.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v1.0-REQUIREMENTS.md).

### M02 - Perfil do Comprador

> [!NOTE]
> As regras de negócio deste módulo foram 100% satisfeitas e arquivadas em [v2.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v2.0-REQUIREMENTS.md).

### M03 - Perfil do Vendedor

> [!NOTE]
> As regras de negócio deste módulo foram 100% satisfeitas e arquivadas em [v2.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v2.0-REQUIREMENTS.md).

### M04 - Catálogo Automotivo

> [!NOTE]
> As regras de negócio deste módulo foram 100% satisfeitas e arquivadas em [v1.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v1.0-REQUIREMENTS.md).

### M05 - Cadastro de Sucata / Veículo

> [!NOTE]
> As regras de negócio deste módulo foram 100% satisfeitas e arquivadas em [v3.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v3.0-REQUIREMENTS.md).

### M06 - Avaliações e Reputação
- **RN-M06-01:** Avaliação permitida apenas para comprador que teve chatRoom com o vendedor
- **RN-M06-02:** Apenas uma avaliação por chatRoom — evitar avaliações duplicadas
- **RN-M06-03:** Moderador pode remover avaliação abusiva via M09
- **RN-M06-04:** Vendedor não avalia comprador nesta versão

### M07 - Busca e Descoberta
- **RN03:** Busca retorna SEMPRE veículos/sucatas completas, NUNCA peças avulsas independentes
- **RN04:** Resultados e detalhe do anúncio NUNCA exibem preço — negociação via chat
- **RN08:** Placa exibida mascarada no detalhe do anúncio: ABC-****
- **RN11:** Chat só pode ser iniciado em anúncios com status PUBLISHED
- **RN-M07-01:** Busca sempre filtra por Listing.status = PUBLISHED (nunca retorna PENDING, REJECTED, SOLD, EXPIRED)

### M08 - Chat e Negociação
- **RN04:** Chat é interface exclusivamente textual — sem campo de preço, sem pagamentos
- **RN11:** Chat só pode ser iniciado em anúncios com status PUBLISHED — anúncios SOLD, REJECTED ou EXPIRED não aceitam novas mensagens
- **RN12:** Apenas comprador e vendedor do anúncio podem acessar o chat específico
- **RN09:** Sistema deve fornecer botões de moderação rápida no chat (Denunciar mensagem), mas não interceptar automaticamente

### M09 - Painel de Moderação
- **RN14:** Nenhum anúncio é publicado sem aprovação de moderador — fluxo mandatório
- **RN15:** Apenas usuários com role MODERATOR ou ADMIN acessam endpoints /moderation/*
- **RN-M09-01:** Rejeição exige rejectionReason não vazio (exibido ao vendedor)
- **RN-M09-02:** Moderador não pode moderar seus próprios anúncios (conflict of interest)
- **RN08:** Placa de veículo exibida no painel de moderação mascarada para moderadores também

### M10 - Gestão de Assinaturas
- **RN-M10-01:** Plano GRATUITO: máximo 3 anúncios PUBLISHED simultâneos
- **RN-M10-02:** Plano PRO: máximo 15 anúncios PUBLISHED simultâneos
- **RN-M10-03:** Plano PREMIUM: máximo 50 anúncios PUBLISHED simultâneos
- **RN-M10-04:** PECAÊ nunca processa dados de cartão diretamente — checkout externo via Mercado Pago
- **RN-M10-05:** Webhook deve ser verificado via HMAC-SHA256 antes de processar

### M11 - Notificações
- **RN-M11-01:** Notificações são persistidas independentemente do canal habilitado (histórico sempre salvo)
- **RN-M11-02:** Push é enviado apenas se PushToken registrado e pushEnabled=true
- **RN-M11-03:** E-mail é enviado apenas para tipos que requerem e-mail (tipo crítico) e emailEnabled=true
- **RN-M11-04:** Rate limit de notificações push: máximo 10 por usuário por hora (exceto chat)

### M12 - Analytics e Dashboard
- **RN-M12-01:** Métricas de vendedor são privadas — apenas o próprio vendedor pode ver
- **RN-M12-02:** Métricas globais (admin) são restritas a ADMIN e MODERATOR (RBAC)
- **RN-M12-03:** ListingView registra apenas 1 view por IP por anúncio a cada 24h (dedup básico)
- **RN-M12-04:** Analytics calculados sobre dados anonimizados — sem identificação de compradores individuais nos logs

### M13 - Anúncios e Publicidade In-App
- **RN04:** Anúncios patrocinados (Sponsored Listings) seguem RN04 — sem exibição de preços; destaque é apenas de posição
- **RN03:** Sponsored Listings são Listings de veículos completos — nunca de peças avulsas
- **RN14:** Sponsored Listings só podem ser ativados se o Listing base tiver status PUBLISHED (aprovado pela moderação)
- **RN-M13-01:** Frequência capping de AdMob Interstitial: máximo 1 por 30 minutos por usuário (controlado no cliente)
- **RN-M13-02:** Máximo de 2 Sponsored Listings por página de resultados (não sobrecarregar a lista com anúncios pagos)
- **RN-M13-03:** Sponsored Listings devem ter badge 'Patrocinado' visualmente claro e não enganoso (transparência para o usuário)
- **RN-M13-04:** Campanha de Sponsored Listing só é ativada após confirmação de pagamento externo pelo Admin — PECAÊ não processa pagamentos (alinha com RN01)
- **RN-M13-05:** Campanhas expiradas são automaticamente desativadas pelo job BullMQ de expiração (sem intervenção manual)
- **RN-M13-06:** AdMob não rastreia dados pessoais sem consentimento — implementar CMP (Consent Management Platform) conforme LGPD/GDPR

### M_favoritos_alertas - Favoritos e Alertas de Busca
- **RN-MFA-01:** Matching de alertas considera apenas anúncios PUBLISHED (nunca PENDING ou REJECTED)
- **RN-MFA-02:** Cada comprador recebe no máximo 5 alertas por dia para evitar spam
- **RN-MFA-03:** Busca salva deletada cancela todos os alertas futuros dessa busca
- **RN-M02-03:** Máximo de 10 buscas salvas ativas por comprador

## Casos de Uso por Módulo

### M01 - Autenticação e Cadastro

> [!NOTE]
> Os casos de uso deste módulo foram 100% satisfeitos e arquivados em [v1.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v1.0-REQUIREMENTS.md).

### M02 - Perfil do Comprador

> [!NOTE]
> Os casos de uso deste módulo foram 100% satisfeitos e arquivados em [v2.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v2.0-REQUIREMENTS.md).

### M03 - Perfil do Vendedor

> [!NOTE]
> Os casos de uso deste módulo foram 100% satisfeitos e arquivados em [v2.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v2.0-REQUIREMENTS.md).

### M04 - Catálogo Automotivo

> [!NOTE]
> Os casos de uso deste módulo foram 100% satisfeitos e arquivados em [v1.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v1.0-REQUIREMENTS.md).

### M05 - Cadastro de Sucata / Veículo

> [!NOTE]
> Os casos de uso deste módulo foram 100% satisfeitos e arquivados em [v3.0-REQUIREMENTS.md](file:///c:/Users/italo/Desktop/Projects/pecae/.planning/milestones/v3.0-REQUIREMENTS.md).

### M06 - Avaliações e Reputação
#### UC35: Avaliar vendedor após negociação
- **Atores:** Comprador
- **Pré-condições:** ChatRoom existente, comprador é buyerId, sem avaliação prévia para este chatRoom
- **Fluxo Principal:**
  1. Comprador acessa opção 'Avaliar vendedor' dentro do chat
  2. Seleciona nota de 1 a 5 estrelas
  3. Opcionalmente escreve comentário
  4. Confirma avaliação
  5. Rating médio do vendedor atualizado via BullMQ
- **Fluxos Alternativos:**
  A1. Avaliação já existe: botão desabilitado com texto 'Você já avaliou'

### M07 - Busca e Descoberta
#### UC25: Buscar sucatas por veículo
- **Atores:** Comprador, Visitante
- **Pré-condições:** Catálogo com dados (M04) e anúncios PUBLISHED (M05)
- **Fluxo Principal:**
  1. Usuário acessa tela de busca
  2. Seleciona marca, modelo e/ou ano
  3. Opcionalmente define localização e texto livre
  4. Sistema retorna sucatas PUBLISHED compatíveis
  5. Usuário visualiza resultados e acessa detalhe
- **Fluxos Alternativos:**
  A1. Zero resultados: sugerir salvar busca como alerta
  A2. Cache hit: retornar resultado sem query ao banco

#### UC26: Visualizar detalhe de sucata
- **Atores:** Comprador, Visitante
- **Pré-condições:** Listing com status PUBLISHED
- **Fluxo Principal:**
  1. Comprador toca em card de sucata nos resultados
  2. Sistema exibe galeria de fotos, dados do veículo, peças disponíveis e dados públicos do vendedor
  3. Comprador toca em 'Entrar em contato' para iniciar chat (M06)
- **Fluxos Alternativos:**
  A1. Anúncio não PUBLISHED: exibir 404 ou mensagem de indisponibilidade

### M08 - Chat e Negociação
#### UC30: Iniciar chat com vendedor
- **Atores:** Comprador
- **Pré-condições:** Comprador autenticado, Listing com status PUBLISHED
- **Fluxo Principal:**
  1. Comprador toca 'Entrar em Contato' no anúncio
  2. Sistema cria/recupera ChatRoom para este comprador + listing
  3. Comprador navega para tela de chat
  4. Comprador envia primeira mensagem
- **Fluxos Alternativos:**
  A1. Listing não PUBLISHED: botão desabilitado + toast 'Anúncio não disponível'
  A2. ChatRoom já existe: abrir sala existente (idempotente)

#### UC31: Trocar mensagens em tempo real
- **Atores:** Comprador, Vendedor
- **Pré-condições:** ChatRoom existente e ambos os usuários ativos
- **Fluxo Principal:**
  1. Usuário digita mensagem
  2. Mensagem enviada via POST /chat/rooms/:id/messages
  3. Mensagem persistida no banco
  4. Supabase Realtime broadcast para o outro usuário
  5. Se destinatário offline: push notification enviado via BullMQ
- **Fluxos Alternativos:**
  A1. Erro de conexão: mensagem fica em fila local e retry automático

#### UC32: Visualizar lista de conversas
- **Atores:** Comprador, Vendedor
- **Pré-condições:** Usuário autenticado com conversas existentes
- **Fluxo Principal:**
  1. Usuário acessa aba Mensagens
  2. Sistema exibe lista de ChatRooms com última mensagem, data e contador de não lidas
  3. Usuário toca em conversa para acessar chat
- **Fluxos Alternativos:**
  A1. Sem conversas: EmptyState com CTA 'Explorar sucatas'

### M09 - Painel de Moderação
#### UC50: Aprovar anúncio de sucata
- **Atores:** Moderador
- **Pré-condições:** Listing com status PENDING_APPROVAL, Moderador autenticado com role MODERATOR ou ADMIN
- **Fluxo Principal:**
  1. Moderador acessa fila de pendentes
  2. Abre anúncio: fotos, dados do veículo, placa mascarada
  3. Valida informações (fotos claras, dados consistentes)
  4. Toca 'Aprovar'
  5. Listing.status = PUBLISHED
  6. Vendedor notificado via push + email
  7. Job match-alerts disparado para alertar compradores com buscas compatíveis

#### UC51: Rejeitar anúncio com motivo
- **Atores:** Moderador
- **Pré-condições:** Listing PENDING_APPROVAL
- **Fluxo Principal:**
  1. Moderador abre anúncio
  2. Identifica problema: fotos de baixa qualidade, dados incorretos, etc
  3. Toca 'Rejeitar'
  4. Preenche motivo de rejeição (obrigatório)
  5. Listing.status = REJECTED
  6. Vendedor notificado com o motivo

#### UC52: Aprovar Selo Verificado de vendedor
- **Atores:** Moderador
- **Pré-condições:** VerificationRequest com status PENDING, documentos enviados pelo vendedor
- **Fluxo Principal:**
  1. Moderador acessa fila de verificações
  2. Analisa documentos enviados (CNPJ/CPF, nota fiscal)
  3. Toca 'Aprovar Verificação'
  4. SellerProfile.isVerified = true
  5. Vendedor notificado: 'Seu Selo Verificado foi aprovado'
- **Fluxos Alternativos:**
  A1. Documentos insuficientes: rejeitar com motivo detalhado

### M10 - Gestão de Assinaturas
#### UC55: Fazer upgrade de plano para PRO
- **Atores:** Vendedor
- **Pré-condições:** Vendedor autenticado com SellerProfile criado
- **Fluxo Principal:**
  1. Vendedor acessa tela de planos (Upgrade)
  2. Seleciona plano PRO
  3. API cria preapproval no Mercado Pago
  4. App abre WebView com checkout URL
  5. Vendedor completa pagamento (externo no Mercado Pago)
  6. Webhook recebido: assinatura autorizada
  7. Subscription.status = ACTIVE, SellerProfile.plan = PRO
- **Fluxos Alternativos:**
  A1. Pagamento recusado: app exibe mensagem de erro, plano não alterado

### M11 - Notificações
#### UC45: Receber notificação de anúncio aprovado
- **Atores:** Vendedor, Sistema
- **Pré-condições:** Listing aprovado pela moderação (M09)
- **Fluxo Principal:**
  1. Moderação aprova listing (M09)
  2. M09 chama notificationService.send({ type: 'LISTING_PUBLISHED', userId: sellerId })
  3. Notificação persistida no banco
  4. Push e e-mail enfileirados no BullMQ
  5. Vendedor recebe push com 'Seu anúncio foi publicado!'
  6. E-mail enviado com detalhes do anúncio

#### UC46: Visualizar central de notificações
- **Atores:** Usuário
- **Pré-condições:** Usuário autenticado
- **Fluxo Principal:**
  1. Usuário acessa aba Notificações
  2. Sistema exibe lista de notificações com data e status de leitura
  3. Usuário toca em notificação → navega para contexto (anúncio, chat, etc)
  4. Notificação marcada como lida automaticamente ao tocar

### M12 - Analytics e Dashboard
#### UC60: Vendedor analisa performance de seus anúncios
- **Atores:** Vendedor
- **Pré-condições:** Vendedor com pelo menos 1 Listing PUBLISHED
- **Fluxo Principal:**
  1. Vendedor acessa Dashboard no perfil
  2. Vê resumo: total de views, total de chats, rating médio
  3. Seleciona período (7/30/90 dias)
  4. Vê gráfico de views por dia
  5. Vê ranking de anúncios por views
- **Fluxos Alternativos:**
  A1. Sem anúncios: EmptyState com CTA 'Cadastrar sua primeira sucata'

#### UC61: Admin analisa métricas globais da plataforma
- **Atores:** Admin
- **Pré-condições:** Usuário com role ADMIN
- **Fluxo Principal:**
  1. Admin acessa Dashboard Admin
  2. Vê cards: DAU, novos usuários hoje, anúncios ativos, pendentes de moderação
  3. Vê gráfico de crescimento de usuários (últimos 30 dias)
  4. Vê distribuição de planos (gratuito/pro/premium)

### M13 - Anúncios e Publicidade In-App
#### UC65: Admin cria campanha de Sponsored Listing
- **Atores:** Admin
- **Pré-condições:** Listing com status PUBLISHED, pagamento externo confirmado
- **Fluxo Principal:**
  1. Admin acessa Painel → Campanhas → Nova Campanha
  2. Seleciona o Listing do vendedor/desmanche
  3. Define período (startDate, endDate) e targeting (brandId?, city?, state?)
  4. Define maxImpressions opcional como cap de entrega
  5. Confirma criação → Campanha ACTIVE
  6. Listing recebe isSponsoredActive = true imediatamente
- **Fluxos Alternativos:**
  A1. Listing não PUBLISHED: erro 409 — campanha não pode ser criada
  A2. Datas inválidas: erro 400 — endDate >= startDate obrigatório

#### UC66: Comprador vê Sponsored Listing na busca
- **Atores:** Comprador
- **Pré-condições:** Há campanha ACTIVE com targeting compatível com a busca do comprador
- **Fluxo Principal:**
  1. Comprador busca por marca/modelo/cidade
  2. API retorna resultados com até 2 Sponsored Listings no topo
  3. SponsoredListingCard exibe badge 'Patrocinado' de forma clara
  4. Impressão registrada assincronamente
  5. Comprador toca no card → vai para tela de detalhes do anúncio
  6. Clique registrado assincronamente
- **Fluxos Alternativos:**
  A1. Sem campanhas compatíveis: lista exibida sem sponsored (posição normal)

#### UC67: App exibe BannerAd AdMob
- **Atores:** Comprador/Vendedor, Google AdMob
- **Pré-condições:** App inicializado, consentimento AdMob concedido
- **Fluxo Principal:**
  1. Usuário acessa tela de resultados de busca
  2. BannerAd no rodapé é carregado pelo AdMob SDK
  3. Google seleciona anúncio programático relevante
  4. Anúncio exibido no rodapé
  5. Receita CPM registrada automaticamente no AdMob Console
- **Fluxos Alternativos:**
  A1. Sem anúncio disponível: espaço do banner fica em branco (sem layout shift)

### M_favoritos_alertas - Favoritos e Alertas de Busca
#### UC40: Ser notificado sobre novo anúncio compatível
- **Atores:** Comprador, Sistema
- **Pré-condições:** Comprador tem SavedSearch com alertActive=true; novo Listing PUBLISHED publicado
- **Fluxo Principal:**
  1. Novo Listing publicado (M09)
  2. Job BullMQ match-alerts dispara
  3. Sistema encontra SavedSearches compatíveis
  4. Cria Notification e envia push
  5. Comprador toca na notificação → vai para tela do anúncio
- **Fluxos Alternativos:**
  A1. Comprador atingiu limite de 5 alertas diários: notificação in-app apenas, sem push

