# Plano de Desenvolvimento — PECAÊ

## 🎯 Objetivos
Corrigir violações das Regras de Negócio (RN03 e RN04) e completar a implementação dos fluxos de Cadastro de Sucata (M05) e Busca (M07) seguindo rigorosamente a documentação em `docs-modules`.

---

## 🏗️ Fase 1: Saneamento e Alinhamento de Backend (Imediato)
**Meta**: Eliminar campos proibidos e consolidar a lógica de criação de anúncios.

1. **Remoção do Campo de Preço (RN04)**:
   - [x] Alterar `prisma/schema.prisma` para remover `price` do modelo `Listing`.
   - [x] Atualizar DTOs (`CreateListingDto`, `UpdateListingDto`, `ListingDetailResponseDto`).
   - [x] Remover lógica de preço nos serviços e controladores.

2. **Unificação da Lógica de Cadastro (RN03 & RN14)**:
   - [x] Eliminar a lógica de "Desmembramento" no `VehiclesService`.
   - [x] Garantir que cada `Vehicle` tenha exatamente um `Listing` principal associado.
   - [x] Assegurar que toda criação/edição resete o status para `PENDING` (Moderação).

3. **Correção de Tipagem**:
   - [x] Resolver os casts `as any` no Prisma.

---

## 📱 Fase 2: Implementação e Ajuste de Fluxos Mobile
**Meta**: Ajustar o Wizard de cadastro e a busca conforme as especificações.

1. **Ajuste do M05 (Cadastro de Sucata)**:
   - [x] Remover campos de preço no `VehicleWizard`.
   - [x] Implementar a atualização rápida de peças disponíveis.
   - [x] Garantir mínimo de 3 e máximo de 12 fotos com seleção de capa.

2. **Ajuste do M07 (Busca e Catálogo)**:
   - [x] Refinar filtros geográficos (Cidade/Estado).
   - [x] Garantir que apenas anúncios `PUBLISHED` sejam visíveis.

---

## ✨ Fase 3: Refinamento e Integração (Digital Forge)
**Meta**: Estética premium e ativação do motor de inteligência de matches.

1. **UI/UX "Digital Forge" (Premium)**:
   - [x] Aplicar Industrial Glassmorphism em Busca, Catálogo e Detalhes.
   - [x] Refinar a paleta de cores e tipografia Space Grotesk.
   - [x] Adicionar micro-animações de carregamento e sucesso.

2. **Motor de Alertas e Match (Integração)**:
   - [x] Implementar background job (`MatchProcessor`) para processar matches.
   - [x] Notificar usuários (M11) quando um veículo doador for publicado e coincidir com uma busca salva.

3. **Refinamento do Chat (M08)**:
   - [x] Melhorar a interface de negociação com estética premium.
   - [x] Garantir que o chat exiba o resumo do veículo negociado no topo (HUD).

4. **Validação Final**:
   - [ ] Teste E2E: Cadastro -> Moderação -> Alerta de Match -> Chat.
