# Plano de Implementação: Transição Centrada em Veículos (M14)

Este plano detalha as etapas finais para consolidar o Veículo (Sucata) como a unidade central de negociação no PECAÊ, garantindo a integridade dos dados e a estabilidade do build mobile.

## 1. Infraestrutura e Banco de Dados
- [ ] **Iniciar Ambiente Docker:** Garantir que os containers de PostgreSQL e Redis estejam operacionais.
- [ ] **Migração Prisma:** Executar `npx prisma migrate dev --name add_vehicle_to_chat_room` para aplicar a relação `vehicleId` no `ChatRoom`.
- [ ] **Seed de Teste:** Validar se existem veículos de teste com inventário populado para simular negociações.

## 2. Validação de Backend (API)
- [ ] **Verificação de Endpoints:** Testar a criação de salas de chat via POST `/chat` enviando `vehicleId`.
- [ ] **Integridade de Dados:** Garantir que o `BuyersService` resolva corretamente a hierarquia `Vehicle -> Version -> Model -> Brand`.
- [ ] **Tratamento de Erros:** Validar o comportamento quando um `vehicleId` inexistente é enviado.

## 3. Validação de Frontend (Mobile)
- [ ] **Fluxo de Navegação:**
    - [ ] Catálogo -> Detalhes do Veículo.
    - [ ] Detalhes do Veículo -> Iniciar Negociação (Chat).
    - [ ] Lista de Negociações (Negociacoes.tsx) exibe dados do veículo.
- [ ] **UX Audit:** Verificar se o design *Industrial Glassmorphism* está consistente nas novas telas.
- [ ] **Performance:** Validar o carregamento das imagens (agora usando componente nativo).

## 4. Estabilização e Qualidade
- [ ] **Lint & Types:** Rodar `lint_runner.py` em todo o monorepo.
- [ ] **Segurança:** Executar `security_scan.py` para validar as novas rotas de chat.
- [ ] **Build Final:** Garantir que ambos `api` e `mobile` buildam sem avisos críticos.

## 5. Orquestração de Agentes (Fase 2)
- **Database Architect:** Executa migrações e valida schema.
- **Backend Specialist:** Valida lógica de serviços e DTOs.
- **Frontend Specialist:** Audita UI/UX e fluxos mobile.
- **Test Engineer:** Executa scripts de verificação final.
