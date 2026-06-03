# Tarefa: Remodelar Cards de Veículos (Grade/Lista)

## 1. Análise
- **Objetivo**: Melhorar o visual dos cards de veículos na Home (Web/Mobile), permitindo alternar entre Grade (2 colunas) e Lista.
- **Novos Requisitos**:
  - Salvar estado de visualização localmente.
  - Adicionar opção de alternar entre modo claro e escuro (salvo localmente).
  - Associar imagens genéricas por Marca/Modelo.

## 2. Planejamento
- [x] Criar estado para alternância de layout e tema.
- [x] Criar `apps/mobile/src/store/ui-store.ts` para persistência.
- [x] Atualizar `apps/mobile/src/theme/index.ts` para usar o tema do store.
- [x] Criar `apps/mobile/src/utils/vehicleImages.ts` para mapeamento de fotos.
- [x] Implementar seletores na Home (`apps/mobile/app/(tabs)/index.tsx`).
- [x] Redesenhar os cards (Grade e Lista) com estilo "Industrial Precision".

## 3. Verificação
- [ ] Testar alternância de modo (Grade/Lista).
- [ ] Testar alternância de tema (Claro/Escuro).
- [ ] Validar persistência após fechar/abrir o app.

