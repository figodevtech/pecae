# Documentação de Implementação — M05: Cadastro de Sucatas

## 📝 Visão Geral
O módulo **M05 (Cadastro de Sucatas)** é o motor de geração de oferta da plataforma PECAÊ. Ele permite que vendedores cadastrados transformem veículos de leilão ou baixa em anúncios de peças através de um processo guiado (**Wizard**) que garante a qualidade dos dados e a conformidade com as regras de moderação.

Este módulo integra-se profundamente com o **M04 (Catálogo)** para identificação precisa do veículo e com o **M03 (Perfil do Vendedor)** para atribuição de posse e geolocalização.

---

## 🏗️ Arquitetura Técnica

### 1. Backend (NestJS + Prisma + BullMQ)
A implementação foca em **Integridade** e **Atomicidade**, utilizando transações para garantir que nenhum veículo seja criado sem um anúncio correspondente.

*   **VehiclesModule**: Gerencia o ciclo de vida do veículo e suas fotos.
*   **Atomic Transactions**: Uso de `prisma.$transaction` na criação para vincular `Vehicle` e `Listing` em uma única operação segura.
*   **Storage Integration**: Sistema de **Presigned URLs** para upload direto ao Supabase Storage, reduzindo a carga na API.
*   **BullMQ Workers**: Processamento assíncrono de imagens (thumbnails) para otimização de performance na busca (M07).

### 2. Mobile (React Native + Zustand + Expo Image Picker)
A interface foi projetada como um **Wizard Multi-passo** para reduzir a carga cognitiva do vendedor.

*   **useVehicleWizardStore**: Estado centralizado via `Zustand` que mantém os dados do rascunho entre os passos sem persistência prematura no servidor.
*   **Direct Upload**: O app realiza o upload binário via `PUT` diretamente para o bucket de storage usando as URLs assinadas geradas pelo backend.
*   **Cascading Selection**: Reutilização dos seletores do M04 para garantir que toda sucata esteja corretamente tipificada no catálogo.

---

## 🗄️ Modelo de Dados (Prisma)

O schema foi estendido para suportar a complexidade dos anúncios:

```prisma
model Vehicle {
  id              String         @id @default(uuid())
  sellerId        String
  versionId       String
  yearFabId       String
  color           String
  plate           String?
  availableParts  String[]       // Array de IDs de PartCategory
  observations    String?
  status          VehicleStatus  @default(AVAILABLE)
  photos          VehiclePhoto[]
  listing         Listing?
}

model Listing {
  id          String        @id @default(uuid())
  vehicleId   String        @unique
  title       String
  description String?
  status      ListingStatus @default(PENDING) // RN14: Moderação Obrigatória
}

model VehiclePhoto {
  id        String    @id @default(uuid())
  vehicleId String
  url       String
  type      PhotoType @default(EXTERNAL)
  order     Int       @default(0)
}
```

---

## ⚡ Fluxo de Fotos e Upload

Para garantir performance e baixo custo operacional, implementamos o seguinte fluxo:
1.  **Request**: O app solicita N URLs de upload ao backend.
2.  **Generate**: O `StorageService` gera URLs assinadas com TTL curto no Supabase.
3.  **Upload**: O app envia os arquivos binários (com compressão local) diretamente para o storage.
4.  **Confirm**: O app envia uma lista de URLs confirmadas ao backend, que as vincula ao `VehiclePhoto`.

---

## 📱 Interface de Usuário (The Digital Wizard)

O Wizard segue o design system **Industrial Glassmorphism**:
*   **Passo 1 (Identificação)**: Seleção de Marca > Modelo > Versão > Ano (via M04).
*   **Passo 2 (Dados Técnicos)**: Cor, Placa, Localização e Observações.
*   **Passo 3 (Galeria)**: Grid visual para os 5 ângulos obrigatórios (Frente, Traseira, Laterais, Interior).
*   **Passo 4 (Inventário)**: Seleção rápida de categorias de peças que estão boas para venda.
*   **Passo 5 (Revisão)**: Checkpoint final com todos os dados consolidados.

---

## 🛡️ Regras de Negócio (RN) Implementadas

*   **RN14 (Moderação)**: Todo novo anúncio ou edição de campos sensíveis força o status para `PENDING`.
*   **RN10 (Duplicidade)**: Verificação de placa/chassi e dados do veículo para evitar anúncios repetidos no mesmo vendedor.
*   **RN04/05 (Privacidade)**: Ocultação automática de campos como Chassi e Preço em DTOs de leitura pública.
*   **RN06 (Venda)**: Fluxo de "Marcar como Vendido" que invalida o anúncio sem deletar os dados históricos (importante para o M06 - BI).

---

## 🛠️ Guia de Uso

### Como cadastrar via Mobile:
```tsx
import { useVehicleWizardStore } from '../store/vehicle-wizard-store';

// Para iniciar novo cadastro
resetWizard();
router.push('/(seller)/cadastrar-sucata');

// Para editar existente
loadVehicle(vehicleData);
router.push('/(seller)/cadastrar-sucata');
```

### Endpoints Principais:
*   `POST /vehicles`: Criação inicial.
*   `POST /vehicles/:id/photos/upload-url`: Geração de tokens de upload.
*   `POST /vehicles/:id/photos/confirm`: Persistência das fotos.
*   `PATCH /vehicles/:id/sold`: Baixa do veículo.

---
**Status da Implementação**: 🟢 Concluído
**Versão**: 1.0.0
**Data**: 23/04/2026
