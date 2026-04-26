# Plano de Trabalho: Remodelação dos Cards de Veículos (Web & Mobile)

Este documento define o plano detalhado para remodelar o layout do catálogo de veículos do PECAÊ, adotando um visual premium no estilo **Itamatay Veículos**, respeitando as decisões de negócio e o sistema de design existente.

---

## 🎯 Objetivos do Projeto

1. **Grid Responsivo na Web:** Expandir o layout para preencher a tela com 3 a 4 colunas (dependendo da largura do dispositivo), evitando áreas vazias.
2. **Layout Mobile Aperfeiçoado:** Manter adaptabilidade em 1 a 2 colunas no mobile.
3. **Estado de Visualização Persistente:** Alternância dinâmica entre Modo Grid e Modo Lista com estado salvo localmente.
4. **Fidelidade Visual:** Utilizar as fotos reais geradas via Unsplash e omitir elementos com dados ausentes (como Cor ou Views).
5. **Navegação:** Clicar no card redireciona para a página de detalhes correspondente.
6. **Ajuste de Cores (Paleta Verde):** Substituir esquemas de cores anteriores pela identidade oficial do PECAÊ baseada em tons de verde (`#2D8C4E`, `#4ADE80`).

---

## 📋 Arquivos Afetados

- **Componente do Catálogo Principal:** `apps/mobile/app/(tabs)/index.tsx`
- **Componente de Card Individual:** (A refatorar ou criar dentro do projeto web/mobile)
- **Store de Estado:** `apps/mobile/src/store/ui-store.ts`

---

## 🛠️ Fases de Implementação (Fase 2)

### Fase 2.1: Estrutura & Grid (Frontend & Mobile)
- Refatorar o container principal da página para usar Flexbox/Grid responsivo (Tailwind/React Native Web adaptativo).
- Implementar a alternância entre Grid e Lista.

### Fase 2.2: Dados & Lógica de Exibição
- Ajustar os campos do veículo: Cidade, Estado, Título, Cor, Views.
- Implementar a omissão condicional de metadados vazios.
- Inserir as etiquetas de "Destaque" e "Verificado".

### Fase 2.3: Estilização com a Paleta Verde
- Implementar os tokens de design do `pecae-tokens.ts` (Verde PECAÊ, Vidro transparente com desfoque).

---

## 🔍 Critérios de Aceitação & Verificação

1. Verificação visual em resoluções de desktop (1920px) e mobile (375px).
2. Sem exibição de preços ou placeholders estranhos.
3. Teste de persistência de estado para Light/Dark mode e visualização Grid/Lista.
