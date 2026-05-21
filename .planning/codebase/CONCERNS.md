# CONCERNS.md

## Preocupações e Alertas (Concerns)

### Redis TTL e BullMQ
- **Stalled/Failed Jobs:** Pode ocorrer sobrecarga de lock no banco de dados (Prisma) quando há alta volumetria processada pelos workers de `ads` e `listings`. O Redis necessita ser versão >= 6.2 para scripts nativos em LUA rodarem sem falhar o processor BullMQ.
- **Concorrência e Rate Limiting:** A sincronização baseada em chaves do Redis (ex: `view:{listingId}:{ip}`) pode reter chaves obsoletas por mais tempo que o esperado caso os Workers caiam. Uma rota de emergência manual (`POST /analytics/trigger-recalc`) atua como contingência.

### Docker Image / Build Times
- Builds Mobile e Backend (TypeScript compilation e Prisma Generation) podem falhar em ambientes com pouco espaço em disco (cache de Imagens e Volumes do Postgres).
- Requisições Mobile emulado (Android) necessitam de roteamento mapeado para `10.0.2.2` no `.env`, pois localhost colide com as limitações de interface de rede virtualizada. Expo LAN necessita expor o IP da máquina na rede (`192.168.x.x`).

### Escalabilidade do Banco
- **Gargalos em Agregações (Reviews e Analytics):** Muitas queries analíticas estão denormalizadas e geram gatilhos atrelados a Perfis de Sellers para diminuir latência no momento da Busca (`/search`). Contínuo monitoramento sobre as agregações financeiras e CTR dos patrocinados deve ser feito para migração futura de data lakes ou bancos analíticos caso escale fortemente.

### Autenticação em Refresh Loop
- Interceptações na camada cliente via Axios podem desencadear um loop contínuo de requests e bloqueio `401 Unauthorized`. Um trigger explícito de reset nativo via Zustand `persist.clearStorage()` deve ser garantido caso a renovação de tokens falhe repetidamente.
