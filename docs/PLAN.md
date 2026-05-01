# Plano de Correção: Problema de Autenticação (401 Unauthorized)

Este plano visa identificar a causa raiz do erro 401 ao realizar login no PECAÊ e aplicar a correção necessária.

## 1. Fase de Diagnóstico (Investigação)
- [x] **Verificar Logs do Backend:** Analisar a saída do container `pecae-api` para distinguir entre "Usuário não encontrado", "Senha inválida" ou "Conta não verificada". (Resolvido: JwtAuthGuard Global estava bloqueando).
- [x] **Auditoria de Banco de Dados:** Verificar se os usuários de teste (`comprador@pecae.com.br`) foram corretamente inseridos pelo seed com status `ACTIVE`. (Usuário funcional).
- [x] **Validar Payload do Frontend:** Confirmar se o payload enviado pelo Mobile (React Hook Form) está no formato esperado pelo DTO do NestJS.
- [x] **Checar Case-Sensitivity:** Validar se a busca por e-mail no `UserService` deve ser normalizada (lowercase) antes da consulta.
- [ ] **Investigar Erro 500 em /listings:** Analisar por que a listagem de anúncios falha após o login.

## 2. Implementação de Correções
- [x] **Normalização de E-mail:** Implementar `toLowerCase()` no login tanto no frontend quanto no backend para evitar erros de digitação.
- [ ] **Ajuste de Seed:** Garantir que o comando de seed seja executado de forma idempotente e confiável no `entrypoint.sh`.
- [x] **Liberar Rotas de Auth:** Aplicar o decorator `@Public()` nas rotas de login/registro para bypassar o Guard global.

## 3. Verificação e Testes
- [x] **Teste de Login Manual:** Validar acesso com `comprador@pecae.com.br` / `Pecae@123`.
- [ ] **Teste de Registro:** Validar fluxo completo de criação de conta e ativação.
- [ ] **Verificação de Segurança:** Rodar `security_scan.py` para garantir que as alterações não fragilizaram o Auth.

## 4. Prevenção
- [ ] Adicionar um script de healthcheck que valide a presença dos usuários de seed após o boot do sistema.

## 5. Estratégia de Commit (Orquestração)
- [ ] **Commit 1 (API Auth):** Bypass de Guard Global e Normalização de E-mail.
- [ ] **Commit 2 (API Listings):** Correção do Erro 500 na listagem.
- [ ] **Commit 3 (Mobile UI):** Refatoração Glassmorphism do módulo Comprador.
- [ ] **Commit 4 (Mobile Nav):** Reestruturação das abas do Vendedor e Proteção de Rotas.
- [ ] **Commit 5 (Docs):** Atualização final do Plano.
