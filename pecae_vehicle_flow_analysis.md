# PECAÊ — Análise Completa do Fluxo de Cadastro de Veículos (Página do Vendedor)

> **Versão analisada:** Commit `492b39a`  
> **Escopo:** `VehiclesController`, `VehiclesService`, `VehiclePhotosProcessor`, `CreateVehicleDto`, `UpdateVehicleDto`, `vehicles.service.spec.ts`, `flow1-core-marketplace.spec.ts`  
> **Perfil de análise:** Especialista em spec-driven development, fluxo de aplicação e harness de testes

---

## Resumo Executivo

O fluxo de cadastro de veículos do PECAÊ tem uma arquitetura sólida em sua concepção (transações atômicas, processamento assíncrono de fotos via BullMQ, máquina de estados para status), mas apresenta **12 bugs e 9 problemas de design** que comprometem a confiabilidade, a segurança e a experiência do vendedor. Os problemas se concentram em três áreas críticas:

1. **DTO sem validação cruzada** — o formulário aceita combinações inválidas de campos que quebram silenciosamente no service
2. **Processamento assíncrono de fotos com estados inconsistentes** — o fluxo `confirmPhotos` → `VehiclePhotosProcessor` deixa o veículo em `DRAFT` sem nenhum mecanismo de feedback para o vendedor
3. **Cobertura de testes insuficiente** — o `spec` cobre menos de 30% dos caminhos críticos de `create()`, com mocks incorretos que não detectam os bugs reais

---

## Parte 1 — Bugs no Código (Backend)

---

### BUG-V01 🔴 CRÍTICO — `create()` cria veículo com `status: PENDING` sem ter fotos

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — linha ~185  
**Método:** `create(sellerId, dto)`

**Problema:**  
O veículo é criado diretamente com `status: VehicleStatus.PENDING` dentro da `$transaction`. Entretanto, o fluxo de fotos é **separado e posterior** — o vendedor precisa chamar `POST /vehicles/:id/photos/upload-url` e depois `POST /vehicles/:id/photos/confirm` em steps separados. Isso significa que um veículo recém-criado fica com status `PENDING` **sem nenhuma foto**, sendo enviado para a fila de moderação com dados incompletos.

O status correto no momento da criação deveria ser `DRAFT`, transitando para `PENDING` **somente após** as fotos serem confirmadas e processadas com sucesso pelo `VehiclePhotosProcessor`.

```typescript
// ATUAL — incorreto: envia para moderação sem fotos
const vehicle = await tx.vehicle.create({
  data: {
    ...vehicleData,
    ...
    status: VehicleStatus.PENDING,  // ❌ não há fotos ainda
  },
});
```

**Correção:**
```typescript
// CORRETO: inicia como DRAFT; o processor muda para PENDING após processar fotos
const vehicle = await tx.vehicle.create({
  data: {
    ...vehicleData,
    ...
    status: VehicleStatus.DRAFT,  // ✅ rascunho até ter fotos
  },
});
```

O `VehiclePhotosProcessor` já faz a transição para `PENDING` corretamente ao final do processamento — portanto, o `create()` deve usar `DRAFT`.

---

### BUG-V02 🔴 CRÍTICO — `confirmPhotos()` deleta fotos existentes antes de enfileirar o job, sem rollback

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `confirmPhotos()`  
**Arquivo relacionado:** `apps/api/src/vehicles/jobs/vehicle-photos.processor.ts`

**Problema:**  
O método `confirmPhotos()` executa uma `$transaction` que:
1. **Deleta TODAS as fotos existentes** do veículo (`deleteMany`)
2. Reverte o status para `DRAFT`
3. Enfileira o job no BullMQ

O problema é que a fila do BullMQ está **fora da transação do Prisma**. Se o `add()` na fila falhar (BullMQ/Redis indisponível), a transação do Prisma já foi commitada — as fotos foram deletadas, o status foi revertido para `DRAFT`, mas **nenhum job foi criado** para processar as novas fotos. O veículo fica preso em `DRAFT` permanentemente sem nenhum mecanismo de recuperação.

```typescript
// ATUAL — problema: add() está fora da atomicidade da transação Prisma
return this.prisma.$transaction(async (tx) => {
  await tx.vehiclePhoto.deleteMany({ where: { vehicleId: id } });    // fotos antigas deletadas
  await tx.vehicle.update({ where: { id }, data: { status: VehicleStatus.DRAFT } });
  await tx.listing.updateMany({ ... data: { status: ListingStatus.DRAFT } });
  
  await this.vehiclePhotosQueue.add('process-vehicle-photo', { vehicleId: id, photos }); // ❌ FORA da tx
  return { message: '...' };
});
```

**Correção:**
```typescript
// CORRETO: registrar fotos pendentes no banco PRIMEIRO, depois enfileirar
// 1. Salvar as fotos com status 'PENDING_PROCESSING' na tabela vehiclePhoto
// 2. Só então chamar queue.add()
// 3. Se queue.add() falhar, usar um mecanismo de outbox pattern ou retry

return this.prisma.$transaction(async (tx) => {
  // Salva as fotos com flag de processamento pendente
  await tx.vehiclePhoto.deleteMany({ where: { vehicleId: id } });
  await tx.vehiclePhoto.createMany({
    data: photos.map(p => ({
      vehicleId: id,
      url: p.url,
      type: p.type,
      order: p.order,
      processingStatus: 'PENDING', // ✅ novo campo no schema
    })),
  });
  await tx.vehicle.update({ where: { id }, data: { status: VehicleStatus.DRAFT } });
  await tx.listing.updateMany({ where: { vehicleId: id }, data: { status: ListingStatus.DRAFT } });
});

// Após a transação, enfileirar — se falhar, o cron job de reconciliação pega depois
try {
  await this.vehiclePhotosQueue.add('process-vehicle-photo', { vehicleId: id, photos });
} catch (queueError) {
  this.logger.error(`Falha ao enfileirar job de fotos para ${id}. Fotos salvas como PENDING no banco para reprocessamento.`);
}
```

---

### BUG-V03 🔴 CRÍTICO — `update()` sobrescreve `versionId` e `yearFabId` com `undefined`

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `update()`

**Problema:**  
O método `update()` desestrutura o DTO com `const { title, description, ...vehicleData } = dto` e passa `vehicleData` direto para `tx.vehicle.update`. Como `UpdateVehicleDto` é um `PartialType(CreateVehicleDto)`, todos os campos são opcionais. Se o vendedor enviar um PATCH com apenas `{ color: "Vermelho" }`, o Prisma irá receber `versionId: undefined`, `yearFabId: undefined`, `plate: undefined` — que **sobrescreve esses campos com NULL no banco** (comportamento padrão do Prisma com `undefined` em `update`).

```typescript
// ATUAL — perigoso: undefined sobrescreve campos no Prisma update
const { title, description, ...vehicleData } = dto;
const updatedVehicle = await tx.vehicle.update({
  where: { id },
  data: { ...vehicleData, status: VehicleStatus.PENDING }, // ❌ spread de undefined
});
```

**Correção:**
```typescript
// CORRETO: remover campos undefined antes do spread
import { omitBy, isUndefined } from 'lodash'; // ou implementar manualmente

const { title, description, versionId, yearFabId, customBrandName, customModelName, 
        customVersionName, customYearFab, customYearModel, ...safeVehicleData } = dto;

const cleanData = omitBy(safeVehicleData, isUndefined);

const updatedVehicle = await tx.vehicle.update({
  where: { id },
  data: { ...cleanData, status: VehicleStatus.PENDING },
});
```

---

### BUG-V04 🔴 CRÍTICO — Duplicidade de placa não é verificada no `update()`

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `update()`

**Problema:**  
O método `create()` verifica duplicidade de placa corretamente (`findFirst({ where: { plate } })`). O método `update()`, porém, não faz essa verificação. Um vendedor pode atualizar um veículo alterando a placa para uma que já existe em outro veículo de outro vendedor, violando a RN10 e causando um erro genérico do banco (constraint único) que chega ao usuário como HTTP 500 em vez de 409 Conflict com mensagem clara.

**Correção:**
```typescript
async update(id: string, sellerId: string, dto: UpdateVehicleDto) {
  // ... verificações de ownership ...
  
  // ✅ Verificar duplicidade de placa se ela está sendo alterada
  if (dto.plate) {
    const plateConflict = await this.prisma.vehicle.findFirst({
      where: { plate: dto.plate, NOT: { id } }, // exclui o próprio veículo
    });
    if (plateConflict) {
      throw new ConflictException('Já existe um veículo cadastrado com esta placa.');
    }
  }
  
  return this.prisma.$transaction(async (tx) => { ... });
}
```

---

### BUG-V05 🟠 ALTO — `findBySeller()` usa `as any` para includes e pode retornar dados corrompidos

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `findBySeller()`

**Problema:**  
O include usa `as any` para contornar tipagem do Prisma:

```typescript
include: { 
  listings: true, 
  photos: { take: 1, orderBy: { order: 'asc' } },
  version: { include: { model: { include: { brand: true } } } },
  yearFab: true
} as any, // ❌ cast perigoso
```

E o map subsequente acessa `v.version?.model?.brand?.name` sem garantia. Se o `versionId` for nulo (veículo criado com catálogo customizado onde a transação falhou parcialmente — ver BUG-V01), `v.version` será `null` e a propriedade `brand` em `v.version?.model?.brand?.name` retorna `''` silenciosamente — o veículo aparece na listagem do vendedor com campos de marca/modelo vazios sem nenhum aviso.

**Correção:**  
Remover `as any`, usar os tipos gerados pelo Prisma client corretamente. Se o schema do Prisma não tiver as relações mapeadas, corrigir o `schema.prisma` antes. Adicionar fallback explícito com log de alerta quando `version` for nulo:

```typescript
brand: v.version?.model?.brand?.name ?? (() => {
  this.logger.warn(`Veículo ${v.id} sem versão/marca vinculada`);
  return 'Não informado';
})(),
```

---

### BUG-V06 🟠 ALTO — `markAsSold()` não retorna o veículo/listing atualizados

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `markAsSold()`

**Problema:**  
O método `markAsSold()` executa a `$transaction` com `updateMany` mas **não retorna nenhum dado** — a transação retorna `undefined` implicitamente porque a última instrução (`tx.listing.updateMany`) não é capturada. O controller vai retornar `undefined` para o frontend, que provavelmente tratará isso como erro ou mostrará estado inconsistente na UI.

```typescript
// ATUAL — retorna undefined
return this.prisma.$transaction(async (tx) => {
  await tx.vehicle.update({ ... });   // await mas não retorna
  await tx.listing.updateMany({ ... }); // última linha, retorna void
}); // ❌ $transaction resolve com undefined
```

**Correção:**
```typescript
return this.prisma.$transaction(async (tx) => {
  const updatedVehicle = await tx.vehicle.update({
    where: { id },
    data: { status: VehicleStatus.SOLD },
  });
  await tx.listing.updateMany({
    where: { vehicleId: id },
    data: { status: ListingStatus.SOLD, soldAt: new Date() },
  });
  return updatedVehicle; // ✅ retornar o veículo atualizado
});
```

O mesmo bug existe em `markAsRemoved()`.

---

### BUG-V07 🟠 ALTO — `generateUploadUrls()` não valida `count` (pode gerar URLs infinitas)

**Arquivo:** `apps/api/src/vehicles/vehicles.controller.ts` + `vehicles.service.ts`

**Problema:**  
O controller recebe `count` do body sem nenhuma validação:

```typescript
// Controller — sem validação
@Body('count') count: number
...
return this.vehiclesService.generateUploadUrls(id, sellerId, count || 5); // ❌
```

E o service aceita qualquer número inteiro:
```typescript
Array.from({ length: count }, async (_, i) => { ... })
```

Um atacante pode enviar `count: 9999` e gerar 9.999 signed URLs do Supabase Storage em uma única requisição, consumindo recursos e gerando custos desnecessários.

**Correção:**
```typescript
// Controller — validar count no DTO ou inline
@Body('count') count: number

// Service — aplicar limite máximo
const MAX_PHOTOS = 20;
if (count < 1 || count > MAX_PHOTOS) {
  throw new BadRequestException(`Quantidade de fotos deve ser entre 1 e ${MAX_PHOTOS}.`);
}
```

Alternativamente, criar um `GenerateUploadUrlsDto` com `@Min(1) @Max(20) @IsInt() count: number`.

---

### BUG-V08 🟠 ALTO — `VehiclePhotosProcessor` tem URLs mock de produção do Unsplash hardcoded

**Arquivo:** `apps/api/src/vehicles/jobs/vehicle-photos.processor.ts` — linhas ~25-35

**Problema:**  
O processor tem um array `mockImages` com URLs do Unsplash hardcoded que **não é usado em nenhum lugar do código atual**, mas sua presença indica código de desenvolvimento que vazou para a branch principal. Mais crítico: a condição que detecta URLs "mock" é:

```typescript
if (photo.url.includes('pecae-mock-storage.com') || photo.url.includes('placeholder') || 
    photo.url.includes('localhost:3000') || photo.url.startsWith('file://')) {
  // mantém URL original sem processar
  continue;
}
```

Esta lógica é adequada para desenvolvimento, mas em staging/produção, se um atacante enviar uma URL que contém a string `placeholder` (ex: `https://meusite.com/placeholder-attack.php`), essa URL seria aceita e gravada **sem nenhum processamento ou validação** no banco de dados.

**Correção:**
1. Remover completamente o array `mockImages` que é dead code
2. Usar uma variável de ambiente `SKIP_IMAGE_PROCESSING=true` para o ambiente de dev em vez de detectar pela URL
3. Validar que a URL processada pertence ao bucket de upload do Supabase antes de aceitar sem processar

---

### BUG-V09 🟡 MÉDIO — `update()` não valida que `plate` não é enviado junto com `versionId`/`customBrandName`

**Arquivo:** `apps/api/src/vehicles/dto/create-vehicle.dto.ts`

**Problema:**  
O DTO `CreateVehicleDto` permite ao mesmo tempo:
- `versionId` (catálogo oficial) E `customBrandName`/`customModelName`/`customVersionName` (catálogo customizado)

Não há `@ValidateIf` cruzado para garantir que apenas UM dos dois caminhos seja enviado. Se o vendedor enviar ambos, o service ignora o customizado (usa `versionId` se presente), mas não lança erro. Isso cria um comportamento silencioso e confuso.

**Correção:**
```typescript
// No DTO, adicionar validação cruzada
@ValidateIf(o => !o.versionId)
@IsString()
@IsNotEmpty({ message: 'customBrandName é obrigatório quando versionId não é fornecido' })
customBrandName?: string;

// Adicionar um @ValidateIf inverso para versionId:
@ValidateIf(o => !o.customBrandName && !o.customModelName && !o.customVersionName)
@IsUUID(undefined, { message: 'versionId deve ser um UUID válido' })
versionId?: string;
```

---

### BUG-V10 🟡 MÉDIO — `reactivate()` não verifica se já existe listing ativo para o veículo

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `reactivate()`

**Problema:**  
O método `reactivate()` reativa um veículo `INACTIVE/REMOVED` sem verificar se o mesmo vendedor já tem outro anúncio ativo com o mesmo `versionId` + `yearFabId`. Enquanto o `create()` faz essa verificação (RN10), o `reactivate()` abre um caminho alternativo para burlar a regra de negócio.

**Correção:**
```typescript
async reactivate(id: string, sellerId: string) {
  const vehicle = await this.prisma.vehicle.findUnique({
    where: { id },
    select: { sellerId: true, status: true, versionId: true, yearFabId: true },
  });
  
  // ✅ Re-checar RN10 antes de reativar
  const duplicate = await this.prisma.listing.findFirst({
    where: {
      sellerProfileId: sellerId,
      vehicle: { versionId: vehicle.versionId, yearFabId: vehicle.yearFabId },
      status: { in: [ListingStatus.PENDING, ListingStatus.PUBLISHED] },
      NOT: { vehicleId: id },
    },
  });
  if (duplicate) throw new ConflictException('Você já possui um anúncio ativo para este veículo.');
  
  // ... continuar com a reativação
}
```

---

### BUG-V11 🟡 MÉDIO — `findAllPublished()` aplica filtro de `q` sobreescrevendo filtro inicial de `listings`

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `findAllPublished()`

**Problema:**  
O `whereClause.listings` é definido primeiro como:
```typescript
listings: { some: { status: ListingStatus.PUBLISHED } }
```

Mas quando `q` está presente, é **sobrescrito por completo**:
```typescript
if (q) {
  whereClause.listings = { // ❌ sobrescreve o filtro de status anterior
    some: {
      status: ListingStatus.PUBLISHED,
      OR: [...],
    },
  };
}
```

Este padrão funciona por acidente neste caso específico (pois o `q` re-adiciona `status: PUBLISHED`), mas é uma armadilha de manutenção grave — se alguém adicionar outro filtro ao bloco `if (q)`, vai silenciosamente remover a restrição de status.

**Correção:**
```typescript
// Definir o filtro base de listings uma única vez
const listingsFilter: any = { status: ListingStatus.PUBLISHED };

if (q) {
  listingsFilter.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
  ];
}

whereClause.listings = { some: listingsFilter }; // ✅ aplicado no final, sem sobrescrita
```

---

### BUG-V12 🟡 MÉDIO — `confirmPhotos()` cancela jobs da fila com lógica O(n) sem índice

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `confirmPhotos()`

**Problema:**  
A lógica de cancelamento de jobs anteriores itera sobre **todos os jobs** da fila em todos os estados (`waiting`, `active`, `delayed`, `paused`) para encontrar os que pertencem ao veículo:

```typescript
const jobs = await this.vehiclePhotosQueue.getJobs(['waiting', 'active', 'delayed', 'paused']);
for (const job of jobs) {
  if (job.data?.vehicleId === id) {
    await job.remove();
  }
}
```

Em produção com múltiplos vendedores cadastrando fotos simultaneamente, esta operação é O(n) sobre todos os jobs da fila. Com 1.000 uploads simultâneos, cada novo upload varre 1.000 jobs — gerando 1.000.000 operações desnecessárias.

**Correção:**  
Usar o `jobId` prefixado com `vehicleId` ao adicionar o job, permitindo remoção direta:

```typescript
// Ao adicionar:
await this.vehiclePhotosQueue.add(
  'process-vehicle-photo',
  { vehicleId: id, photos },
  { jobId: `vehicle-photos-${id}` } // ✅ ID determinístico
);

// Ao cancelar (O(1)):
await this.vehiclePhotosQueue.remove(`vehicle-photos-${id}`).catch(() => null);
```

---

## Parte 2 — Problemas de Fluxo (UX e Regras de Negócio)

---

### FLUXO-01 🔴 — Vendedor não recebe feedback quando o processamento de fotos falha

**Descrição:**  
O fluxo atual é: `POST /photos/confirm` → retorna 200 imediatamente → job processa em background → se falhar, o veículo volta para `DRAFT`. O vendedor não recebe **nenhuma notificação** sobre a falha. Ele precisa voltar à listagem de veículos, perceber que o status voltou para "Rascunho" e tentar descobrir o que aconteceu.

**Solução recomendada:**
- Adicionar um campo `photoProcessingStatus: PENDING | PROCESSING | FAILED | DONE` no modelo `Vehicle`
- Expor um endpoint `GET /vehicles/:id/photo-status` que o frontend pode fazer polling
- Alternativamente, usar WebSockets/SSE para notificação push quando o job terminar
- No caso de falha, gravar uma `photoProcessingError: string` com a mensagem para o vendedor

---

### FLUXO-02 🔴 — Nenhum limite de fotos por veículo é enforced

**Descrição:**  
O endpoint `POST /vehicles/:id/photos/confirm` aceita qualquer array de fotos sem verificar quantas fotos o veículo já tem. Um vendedor pode fazer múltiplas chamadas e acumular centenas de fotos, pois o `deleteMany` só limpa se o confirmPhotos for chamado. Não há regra de máximo de fotos (ex: 20 fotos por veículo) implementada.

**Solução:**
```typescript
// No service, antes de processar:
const existingPhotoCount = await this.prisma.vehiclePhoto.count({ where: { vehicleId: id } });
const MAX_PHOTOS_PER_VEHICLE = 20;
if (photos.length > MAX_PHOTOS_PER_VEHICLE) {
  throw new BadRequestException(`Máximo de ${MAX_PHOTOS_PER_VEHICLE} fotos por veículo.`);
}
```

---

### FLUXO-03 🟠 — Fluxo de cadastro com catálogo customizado cria entradas no catálogo global sem aprovação

**Descrição:**  
Quando o vendedor usa `customBrandName`, `customModelName`, `customVersionName`, o service cria automaticamente novas entradas em `VehicleBrand`, `VehicleModel` e `VehicleVersion` — que são as tabelas do catálogo **compartilhado por todos os usuários do marketplace**. Isso significa que qualquer vendedor pode poluir o catálogo com dados incorretos, com erros de digitação ou com marcas inexistentes.

**Solução recomendada:**  
Criar as entidades customizadas com um flag `isCustom: true` e `approvalStatus: PENDING`. Elas ficam visíveis apenas para o vendedor que as criou até serem aprovadas por um moderador. O `CatalogService.invalidateCatalogCache()` (já chamado após a criação) só deve incluir entradas com `approvalStatus: APPROVED`.

---

### FLUXO-04 🟠 — `PUT /vehicles/:id` e `PATCH /vehicles/:id` fazem exatamente a mesma coisa

**Descrição:**  
O controller registra dois endpoints (`@Put(':id')` e `@Patch(':id')`) que chamam o mesmo método `vehiclesService.update()`. Semanticamente, `PUT` deveria substituir o recurso completo e `PATCH` deveria atualizar parcialmente. Na prática, ambos chamam `UpdateVehicleDto` (que é um `PartialType`) e fazem atualização parcial — o `PUT` está funcionando como `PATCH`. Isso gera confusão no frontend e nos testes sobre qual verbo usar.

**Solução:**  
Remover o `@Put(':id')` ou criar um `ReplaceVehicleDto` não-parcial específico para PUT. Documentar claramente no Swagger que o PATCH é o endpoint canônico de atualização parcial.

---

### FLUXO-05 🟠 — Status `PENDING` do veículo não tem prazo de expiração

**Descrição:**  
Um veículo em `PENDING` (aguardando moderação) pode ficar nesse estado indefinidamente se a moderação nunca acontecer. Não há nenhum cron job ou mecanismo que expire veículos `PENDING` após X dias, nem que notifique o vendedor sobre o andamento da moderação.

**Solução:**  
Adicionar `pendingSince: DateTime` ao modelo `Vehicle`. Criar um cron job (via BullMQ scheduled jobs ou `@nestjs/schedule`) que a cada 24h verifica veículos `PENDING` há mais de N dias e os reverte para `DRAFT` com um email de notificação ao vendedor.

---

### FLUXO-06 🟡 — `availableParts` pode ficar desatualizado após `update()` do veículo

**Descrição:**  
O método `update()` inclui `availableParts` no spread `vehicleData`. Se o vendedor não enviar `availableParts` no PATCH, o campo fica inalterado (devido ao BUG-V03 se corrigido). Se enviar um array vazio `[]`, limpa todas as peças. Não há endpoint específico documentado para "remover todas as peças" — isso pode acontecer acidentalmente se o frontend não popular esse campo no payload de PATCH.

**Solução:**  
Tratar `availableParts` no `update()` da mesma forma que o `PATCH /vehicles/:id/parts` — com verificação explícita:

```typescript
if (dto.availableParts !== undefined) {
  cleanData.availableParts = dto.availableParts;
}
```

---

### FLUXO-07 🟡 — `delete()` (hard delete) não verifica se veículo tem anúncios ativos

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `remove()`

**Descrição:**  
O método `remove()` provavelmente faz hard delete direto (ou soft delete via `deletedAt`), mas não foi possível verificar o código completo. Baseado no padrão encontrado nos outros métodos, não há verificação se o veículo tem `listings` com status `PUBLISHED` antes de deletar — compradores que salvaram ou estão consultando o anúncio verão um 404 inesperado.

**Solução:**  
Antes de deletar, verificar se há listings publicados. Se houver, forçar transição para `markAsRemoved()` em vez de deletar, ou exigir confirmação explícita com parâmetro `force=true`.

---

### FLUXO-08 🟡 — Sem validação de `state` como enum de UF válido

**Arquivo:** `apps/api/src/vehicles/dto/create-vehicle.dto.ts`

**Descrição:**  
O campo `state` é validado apenas como `@IsString() @MaxLength(2)`. Qualquer string de 2 caracteres é aceita — `"XX"`, `"99"`, `"ZZ"`. Não há validação de que deve ser uma UF brasileira válida (SP, RJ, CE, etc.).

**Correção:**
```typescript
import { IsIn } from 'class-validator';

const VALID_UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

@IsIn(VALID_UF, { message: 'Estado deve ser uma UF brasileira válida' })
state: string;
```

---

### FLUXO-09 🟡 — Sem paginação em `findBySeller()` (listagem do vendedor)

**Arquivo:** `apps/api/src/vehicles/vehicles.service.ts` — método `findBySeller()`

**Descrição:**  
`findBySeller()` retorna **todos** os veículos do vendedor sem paginação, limit ou offset. Um vendedor ativo com 500 veículos vai transferir todos os 500 registros (com fotos incluídas) a cada carregamento da página de gerenciamento. Isso causa problemas sérios de performance e custo de banda.

**Correção:**
```typescript
async findBySeller(sellerId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [total, vehicles] = await Promise.all([
    this.prisma.vehicle.count({ where: { sellerId } }),
    this.prisma.vehicle.findMany({
      where: { sellerId },
      include: { ... },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);
  return { items: vehicles.map(...), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
```

---

## Parte 3 — Problemas no Harness de Testes

---

### TEST-01 🔴 — Spec de `create()` usa mock incorreto que não detecta o BUG-V01

**Arquivo:** `apps/api/src/vehicles/vehicles.service.spec.ts` — describe `[VEH-U-04]`

**Problema:**  
O mock do `$transaction` é definido como:
```typescript
$transaction: jest.fn(async (callback) => {
  const tx = {
    vehicle: mockPrisma.vehicle,
    listing: mockPrisma.listing,
  };
  return callback(tx);
}),
```

Este mock **não inclui** `vehicleBrand`, `vehicleModel`, `vehicleVersion`, `vehicleYear` — que são necessários para o caminho de catálogo customizado. Se o teste tentar usar `customBrandName` sem `versionId`, o `tx.vehicleBrand.findFirst` vai lançar `TypeError: tx.vehicleBrand is not a function` em vez de exercitar a lógica real.

Além disso, o teste `[VEH-U-04]` verifica o status criado mas o assert passa em `VehicleStatus.PENDING` quando o correto (após a correção do BUG-V01) deveria ser `VehicleStatus.DRAFT`.

**Correção do mock:**
```typescript
const mockPrisma: any = {
  vehicle: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
  listing: { findFirst: jest.fn(), create: jest.fn(), createMany: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
  vehicleBrand: { findFirst: jest.fn(), create: jest.fn() },
  vehicleModel: { findFirst: jest.fn(), create: jest.fn() },
  vehicleVersion: { findFirst: jest.fn(), create: jest.fn() },
  vehicleYear: { findFirst: jest.fn(), create: jest.fn() },
  vehiclePhoto: { deleteMany: jest.fn(), createMany: jest.fn(), count: jest.fn() },
  $transaction: jest.fn(async (callback) => {
    const tx = { ...mockPrisma }; // ✅ inclui todas as entidades
    return callback(tx);
  }),
};
```

---

### TEST-02 🔴 — Nenhum teste cobre o `VehiclePhotosProcessor`

**Arquivo:** `apps/api/src/vehicles/jobs/vehicle-photos.processor.ts`

**Problema:**  
O `VehiclePhotosProcessor` é a parte mais crítica e complexa do fluxo (processamento de imagens com Sharp, upload para Supabase, rollback em caso de falha, atualização de status), mas **não tem nenhum arquivo de spec**. Os caminhos não testados incluem:
- Falha no download da imagem original
- Falha no processamento com Sharp (imagem corrompida)
- Falha no upload para o Supabase Storage
- Rollback correto de status quando o job falha
- URLs de mock sendo aceitas sem processamento

**Spec mínimo recomendado:**
```typescript
// vehicle-photos.processor.spec.ts
describe('VehiclePhotosProcessor', () => {
  describe('[PROC-01] Processamento bem-sucedido', () => {
    it('deve criar registros de fotos e mudar status para PENDING');
  });
  describe('[PROC-02] Falha no download', () => {
    it('deve reverter status para DRAFT e não criar registros de fotos');
  });
  describe('[PROC-03] URL mock detectada', () => {
    it('deve manter URL original sem processamento');
  });
  describe('[PROC-04] Falha parcial (1 de 3 fotos falha)', () => {
    it('deve processar as fotos que conseguiu e manter a URL original das que falharam');
  });
});
```

---

### TEST-03 🟠 — Spec não cobre caminhos de `update()` nem de `markAsSold()`

**Arquivo:** `apps/api/src/vehicles/vehicles.service.spec.ts`

**Problema:**  
Os 4 testes existentes (`[VEH-U-01]` a `[VEH-U-04]`) cobrem apenas `updateStatus()` e criação básica. Os métodos `update()`, `markAsSold()`, `markAsRemoved()`, `reactivate()`, `findBySeller()`, `generateUploadUrls()` e `confirmPhotos()` não têm nenhum teste — totalizando menos de 30% de cobertura dos métodos do service.

**Testes críticos faltando:**

| Método | Cenário | Spec ID sugerido |
|--------|---------|-----------------|
| `update()` | Spread de undefined não sobrescreve campos | VEH-U-05 |
| `update()` | Placa duplicada lança ConflictException | VEH-U-06 |
| `markAsSold()` | Retorna o veículo atualizado | VEH-U-07 |
| `markAsSold()` | Não permite reverter SOLD para outro status | VEH-U-08 |
| `confirmPhotos()` | Enfileira job corretamente | VEH-U-09 |
| `generateUploadUrls()` | count > 20 lança BadRequestException | VEH-U-10 |
| `findBySeller()` | Retorna lista paginada corretamente | VEH-U-11 |

---

### TEST-04 🟠 — E2E `flow1` acoplado ao ambiente WSL/Docker do desenvolvedor

**Arquivo:** `e2e/flow1-core-marketplace.spec.ts` — função `runSqlQuery()`

**Problema:**  
```typescript
const command = 'wsl -u root docker exec -i pecae-postgres-test psql -U postgres -d pecae_test_db -t -A';
```

Este comando quebra em qualquer ambiente que não seja o Windows com WSL do desenvolvedor original (GitHub Actions, CI Linux nativo, Mac, Docker Compose sem WSL). Além disso, o `beforeAll` executa DELETE diretamente no banco de testes sem usar o padrão de setup do Playwright (`globalSetup`), o que pode causar race conditions com outros testes paralelos.

**Correção:**  
Substituir `runSqlQuery` por uma das seguintes estratégias:

```typescript
// Opção A: Usar endpoint de seed protegido por NODE_ENV=test
async function seedTestData(request: APIRequestContext) {
  const res = await request.post('/api/v1/testing/reset', { 
    headers: { 'X-Test-Secret': process.env.TEST_SECRET }
  });
  expect(res.ok()).toBeTruthy();
}

// Opção B: Usar Prisma diretamente no globalSetup do Playwright
// playwright.config.ts:
// globalSetup: './e2e/global-setup.ts'
// global-setup.ts:
import { PrismaClient } from '@prisma/client';
export default async function() {
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
  await prisma.vehicle.deleteMany({ where: { plate: 'EEE-9999' } });
  await prisma.$disconnect();
}
```

---

## Parte 4 — Plano de Correção Priorizado

### Sprint 1 — Bugs Críticos de Dados (Estimativa: 1 dia)

| # | Bug | Arquivo | Ação |
|---|-----|---------|------|
| V01 | Veículo criado como PENDING sem fotos | `vehicles.service.ts` `create()` | Mudar para `DRAFT` |
| V03 | `update()` sobrescreve campos com undefined | `vehicles.service.ts` `update()` | Adicionar `omitBy(isUndefined)` |
| V04 | Placa duplicada não verificada no update | `vehicles.service.ts` `update()` | Adicionar `findFirst` antes da tx |
| V06 | `markAsSold()` retorna undefined | `vehicles.service.ts` | Retornar veículo atualizado |

### Sprint 2 — Robustez do Fluxo de Fotos (Estimativa: 2 dias)

| # | Bug | Arquivo | Ação |
|---|-----|---------|------|
| V02 | Race condition entre tx e queue.add | `vehicles.service.ts` `confirmPhotos()` | Salvar fotos como PENDING antes, queue fora da tx |
| V07 | `count` sem validação máxima | `vehicles.controller.ts` | Criar `GenerateUploadUrlsDto` com `@Max(20)` |
| V08 | URLs mock hardcoded no processor | `vehicle-photos.processor.ts` | Mover para env var `SKIP_IMAGE_PROCESSING` |
| V12 | Cancelamento de jobs O(n) na fila | `vehicles.service.ts` | Usar `jobId` determinístico |
| F02 | Sem limite de fotos por veículo | `vehicles.service.ts` | Checar count antes de `confirmPhotos` |

### Sprint 3 — Validações e Regras de Negócio (Estimativa: 1 dia)

| # | Bug | Arquivo | Ação |
|---|-----|---------|------|
| V09 | DTO aceita catálogo oficial + customizado juntos | `create-vehicle.dto.ts` | Adicionar `@ValidateIf` cruzado |
| V10 | `reactivate()` ignora RN10 | `vehicles.service.ts` | Re-checar duplicidade ao reativar |
| V11 | Filtro de `q` sobrescreve filtro de status | `vehicles.service.ts` `findAllPublished()` | Construir filtro incremental |
| F08 | `state` sem validação de UF | `create-vehicle.dto.ts` | Adicionar `@IsIn(VALID_UF)` |
| F09 | `findBySeller()` sem paginação | `vehicles.service.ts` | Adicionar `skip`/`take` e `meta` |

### Sprint 4 — Melhorias de Fluxo e Qualidade (Estimativa: 2 dias)

| # | Problema | Arquivo | Ação |
|---|----------|---------|------|
| F01 | Sem feedback de falha de fotos | Service + Controller | Adicionar `photoProcessingStatus` + endpoint de polling |
| F03 | Catálogo customizado sem aprovação | `vehicles.service.ts` | Adicionar flag `isCustom` + fluxo de moderação de catálogo |
| F04 | PUT e PATCH idênticos | `vehicles.controller.ts` | Remover `@Put` ou criar semântica correta |
| F05 | Sem expiração de PENDING | Novo CronJob | Criar `VehicleExpirationService` com `@nestjs/schedule` |
| TEST-01 | Mock incorreto no spec | `vehicles.service.spec.ts` | Corrigir mock da `$transaction` |
| TEST-02 | Processor sem testes | Novo arquivo | Criar `vehicle-photos.processor.spec.ts` |
| TEST-03 | Métodos sem cobertura | `vehicles.service.spec.ts` | Adicionar 7+ novos describes |
| TEST-04 | E2E acoplado ao WSL | `e2e/global-setup.ts` | Migrar para Prisma no globalSetup |

---

## Apêndice — Resumo de Severidade

| Severidade | Quantidade | Impacto |
|------------|-----------|---------|
| 🔴 Crítico | 4 bugs (V01, V02, V03, V04) | Dados corrompidos, estados inconsistentes, erros 500 |
| 🟠 Alto | 4 bugs (V05–V08) | Falhas silenciosas, vulnerabilidades, UX quebrada |
| 🟡 Médio | 4 bugs (V09–V12) | Regras de negócio contornáveis, performance |
| 🔴 Crítico (Fluxo) | 2 (F01, F02) | Vendedor sem feedback, ausência de limites |
| 🟠 Alto (Fluxo) | 3 (F03–F05) | Catálogo poluído, semântica de API incorreta |
| 🟡 Médio (Fluxo) | 4 (F06–F09) | Dados inconsistentes, sem paginação |
| 🔴 Crítico (Testes) | 2 (T01, T02) | Mocks errados não detectam bugs, processor sem cobertura |
| 🟠 Alto (Testes) | 2 (T03, T04) | Cobertura <30%, E2E não portável para CI |

