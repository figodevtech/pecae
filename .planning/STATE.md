# STATE.md

## Estado Atual do Projeto

**Status de Desenvolvimento:** Roadmap cronológico reorganizado por Milestones/Sprints.

### Progresso dos Módulos por Milestones

- **Milestone 1 (Sprint 1)**: M01 (Autenticação) & M04 (Catálogo) — Status: `completed`
- **Milestone 2 (Sprint 2)**: M02 (Perfil Comprador) & M03 (Perfil Vendedor) — Status: `completed`
- **Milestone 3 (Sprint 3)**: M05 (Cadastro de Sucata) — Status: `completed`
- **Milestone 4 (Sprint 4)**: M07 (Busca e Descoberta) — Status: `completed`
- **Milestone 5 (Sprint 5)**: M08 (Chat e Negociação) — Status: `completed`
- **Milestone 6 (Sprint 6)**: M06 (Avaliações), M09 (Moderação), M11 (Notificações) & MFA (Alertas) — Status: `completed`
- **Milestone 7 (Sprint 7)**: M13 (Ads e Monetização) — Status: `completed`
- **Milestone 8 (Sprint 8)**: M12 (Analytics) — Status: `completed` (M10 Assinaturas: `deferred`)

### Estabilização e Testes E2E (Playwright)

- **Suíte E2E Completa**: Estabilizada e 100% aprovada rodando sob o WSL/Docker em 03/06/2026.
  - *Fluxo 1 (Core Marketplace)*: ✅ Aprovado com correções de seletores de RegExp e login de Comprador.
  - *Fluxo 2 (Chat/Negociação)*: ✅ Aprovado com correção de deadlock e suporte a diálogos alert() nativos na Web.
  - *Fluxo 3 (Identidade/Onboarding)*: ✅ Aprovado.
  - *Fluxo 4 (Monetização/Quotas)*: ✅ Aprovado.
  - *Fluxo 5 (RBAC/CASL)*: ✅ Aprovado.

### Próxima Etapa Ativa:
- **Milestones 1 a 8 concluídas**. MVP e escopos adicionais entregues com sucesso.
- **Próximos Passos**: Manutenção, deploy em produção, monitoramento e eventuais melhorias pós-lançamento.
