# PLANO DE IMPLEMENTAÇÃO: Refatoração Visual & UX (M01-T02-ST03)

## 🎼 Orchestration Context
- **Task:** Aplicar a identidade visual "The Digital Forge" (Industrial Glassmorphism) nas telas de Cadastro e Verificação do Mobile.
- **Agents:** project-planner, mobile-developer, frontend-specialist, security-auditor.
- **Reference:** `.agent/skills/brand-system/`

---

## 🏗️ FASE 1: Fundação & Componentes de Design (ForgeUI) [CONCLUÍDA]

### 1.1. Setup Técnico (Mobile)
- [x] Instalação de dependências visuais: `npx expo install expo-blur expo-linear-gradient`
- [x] Configuração de fontes: Integrar `Space Grotesk` e `Manrope` via `expo-font` no `_layout.tsx`.
- [x] Criação do arquivo de tokens mobile: `apps/mobile/src/theme/forge-tokens.ts`.

### 1.2. Criação de Componentes Atômicos (ForgeUI)
- [x] **ForgeGlassCard:** Container com `BlurView`, transparência e "No-Line" border.
- [x] **ForgeButton:** Botão com gradiente vibrante, all-caps Space Grotesk e feedback tátil.
- [x] **ForgeInput:** Input transparente com focus state verde elétrico e rótulos técnicos.
- [x] **ForgeBackground:** Gradiente de fundo obsidian/mint com "Ambient Glows".

---

## 🎨 FASE 2: Refatoração de Telas [CONCLUÍDA]

### 2.1. Tela de Cadastro (apps/mobile/app/(auth)/register.tsx)
- [x] Aplicar `ForgeBackground` como base.
- [x] Envolver o formulário no `ForgeGlassCard`.
- [x] Substituir `TextInput` por `ForgeInput`.
- [x] Substituir botões por `ForgeButton`.
- [x] Ajustar espaçamentos (Thumb Zone) e tipografia.
- [ ] Adicionar micro-interações de erro (shake effect) em campos inválidos.

### 2.2. Tela de Verificação (apps/mobile/app/(auth)/verify-email.tsx)
- [x] Refatorar input de código para um estilo de "Terminal de Diagnóstico".
- [x] Implementar carregamento glassmorphism ao validar token.
- [x] Assegurar legibilidade total em modo claro e escuro.

### 2.3. Tela de Login (apps/mobile/app/(auth)/login.tsx) [EXTRA]
- [x] Refatoração completa seguindo a identidade "The Digital Forge".
- [x] Adição de Tag de Status técnica e rodapé de auditoria.

---

## 🔐 FASE 3: Sessão & Segurança [CONCLUÍDA]

### 3.1. Gestão de Sessão (Refresh Token Rotation)
- [x] Implementação de rotação de tokens no backend (AuthService/Controller).
- [x] Atualização do `useAuthStore` para persistência segura de Access e Refresh Tokens.
- [x] Implementação de interceptador Axios para renovação automática de sessão.

### 3.2. Auditoria de UX/Segurança
- [x] Validar que dados sensíveis permanecem protegidos no SecureStore.
- [x] Verificar se as mensagens de erro não expõem detalhes do sistema.
- [ ] Garantir que o fluxo de deep link de verificação não foi quebrado.

---

## ✅ CRITÉRIOS DE ACEITE
- [x] **Estética:** Visual fiel ao "Industrial Glassmorphism" (Blur 16px, No-Line).
- [x] **Segurança:** Sessão resiliente com renovação automática.
- [x] **Responsividade:** Layout testado em simulação mobile.

---

## 🛠️ SCRIPTS DE VERIFICAÇÃO
- `python .agent/skills/frontend-design/scripts/ux_audit.py .`
- `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
