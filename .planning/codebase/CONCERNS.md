## 🟢 Problemas Resolvidos

### 1. Campo de Preço Proibido (RN04) - ✅ RESOLVIDO
- **Ação**: Campo `price` removido do Prisma, DTOs, Services e Hooks do Mobile.
- **Status**: Em conformidade total com o PRD.

### 2. Lógica de "Desmembramento" Incorreta (RN03) - ✅ RESOLVIDO
- **Ação**: Removida a criação automática de múltiplos anúncios no `VehiclesService`. Agora cada veículo possui exatamente um anúncio principal.
- **Status**: Em conformidade total com o PRD.

## 🟡 Débitos Técnicos & Inconsistências

### 3. Duplicação de Lógica de Serviço
- **Problema**: Tanto o `VehiclesService` quanto o `ListingsService` possuem métodos `create` e `update` com responsabilidades sobrepostas.
- **Impacto**: Custo de manutenção elevado e potencial para erros de sincronização de estado (ex: status de moderação não sendo resetado em todos os fluxos).

### 4. Segurança de Tipos no Prisma
- **Problema**: Uso extensivo de casts `as any` nos serviços `VehiclesService` e `ListingsService`.
- **Impacto**: Perda de segurança em tempo de compilação e aumento do risco de falhas em tempo de execução.

### 5. Completude do Roteamento Mobile
- **Problema**: Embora o diretório `app/` exista, alguns passos do wizard em `VehicleWizard` podem não estar totalmente integrados com as mudanças mais recentes da API (ex: confirmação de upload de fotos).

## 🟢 Lacunas de Implementação
- **Módulo M10 (Admin)**: Atualmente focado apenas no backend; falta uma interface administrativa dedicada no mobile/web além do Swagger.
- **Refinamento de Busca (M07)**: Os filtros de geolocalização no `VehiclesService` são básicos e podem precisar de otimização para escala.
