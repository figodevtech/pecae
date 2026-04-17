# System Design: PEÇAE - Marketplace de Sucatas Inteiras

## 1. Identidade Visual & Conceito
O projeto utiliza o conceito de **Glassmorphism** (Morfismo de Vidro) para criar uma interface que transmite modernidade, transparência e tecnologia. O foco é em veículos inteiros para sucata, exigindo um visual que equilibre o aspecto industrial com uma experiência de usuário premium.

### Pilares do Design:
- **Transparência:** Uso de superfícies translúcidas para dar profundidade.
- **Fluidez:** Gradientes suaves e transições orgânicas.
- **Clareza:** Tipografia nítida e iconografia intuitiva sobre fundos complexos.

---

## 2. Paleta de Cores (Design Tokens)

### Cores Primárias (Marca)
- **Verde PEÇAE (Principal):** `#2D8C4E` - Usado para ações principais e branding.
- **Verde Vibrante:** `#4ADE80` - Usado para estados ativos e feedbacks positivos.
- **Verde Escuro:** `#14532D` - Usado em textos de alto contraste e headers.

### Cores de Fundo (Glass Base)
- **Background Principal:** Gradiente linear de `#E8F5E9` para `#C8E6C9` (Light Mode) ou `#022C22` para `#064E3B` (Dark Mode).
- **Glass Card:** `rgba(255, 255, 255, 0.4)` com `backdrop-filter: blur(12px)`.
- **Glass Border:** `rgba(255, 255, 255, 0.5)` (Sutil 1px).

---

## 3. Tipografia
- **Família:** Inter ou Plus Jakarta Sans (Sans-serif moderna).
- **Escala:**
  - **H1:** 24px Bold (Títulos de Tela)
  - **H2:** 20px SemiBold (Nomes de Veículos)
  - **Body:** 16px Regular (Descrições)
  - **Caption:** 12px Medium (Preços e Localização)

---

## 4. Componentes Principais

### A. Cards de Veículo (GlassCard)
- **Propriedades:** Cantos arredondados (16px), sombra projetada suave, borda branca translúcida de 1px.
- **Conteúdo:** Imagem de alta qualidade da sucata inteira, tag de categoria (Carro/Moto), preço em destaque e localização.

### B. Botões (ActionButtons)
- **Primário:** Preenchimento verde sólido ou gradiente com brilho interno.
- **Secundário:** Estilo "Ghost" com borda glassmorphism.

### C. Inputs de Busca & Formulários
- **Estilo:** Campos translúcidos com ícones minimalistas. Foco com borda verde brilhante.

---

## 5. Diretrizes de Imagem
- **Sucatas:** Devem ser exibidas como unidades inteiras. 
- **Qualidade:** Fotos de ângulos 3/4 para mostrar o volume do veículo.
- **Filtros:** Leve ajuste de nitidez para ressaltar texturas metálicas.

---

## 6. Micro-interações (Framer Motion)
- **Hover/Tap nos Cards:** Escala sutil (1.02x) e aumento do brilho da borda.
- **Transições de Tela:** Fade-in com slide lateral suave para simular navegação nativa.
