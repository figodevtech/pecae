# Documentação de Implementação — M04: Catálogo Automotivo

## 📝 Visão Geral
O módulo **M04 (Catálogo Automotivo)** provê a infraestrutura base para identificação de veículos na plataforma PECAÊ. Ele gerencia a hierarquia de marcas, modelos, versões e anos, além das categorias fixas de peças (`PartCategory`). 

Este módulo é fundamental para o **M05 (Cadastro de Sucatas)** e **M07 (Busca)**, garantindo que os dados sejam consistentes e as consultas sejam extremamente rápidas.

---

## 🏗️ Arquitetura Técnica

### 1. Backend (NestJS + Prisma + Redis)
A implementação segue os princípios **SOLID**, especificamente o **Single Responsibility Principle (SRP)**, segregando operações públicas de administrativas.

*   **CatalogModule**: Centraliza a lógica do catálogo.
*   **RedisService**: Implementação personalizada usando `ioredis` para garantir performance de sub-100ms em consultas cacheadas.
*   **CatalogController (Público)**: Endpoints de leitura rápida (`GET /catalog/...`) decorados com `@Public()`.
*   **AdminCatalogController (Protegido)**: Gerenciamento administrativo e invalidação de cache, protegido por `JwtAuthGuard` e `RolesGuard`.

### 2. Mobile (React Native + Expo + TanStack Query)
A interface mobile foi construída com foco em **Performance** e **Aesthetica**.

*   **useCatalog Hook**: Utiliza `TanStack Query` com `staleTime` de 1 hora, reduzindo chamadas desnecessárias à rede.
*   **VehicleSelector**: Componente hierárquico (Cascata) com visual **Industrial Glassmorphism**.
*   **FlashList**: Utilizada para renderização ultra-eficiente de grandes listas de marcas e modelos.

---

## 🗄️ Modelo de Dados (Prisma)

A hierarquia foi implementada conforme o schema:

```prisma
// Enums para padronização
enum VehicleSegment { HATCH, SEDAN, SUV, PICKUP, VAN, TRUCK, MOTORCYCLE, OTHER }
enum FuelType { GASOLINE, ETHANOL, FLEX, DIESEL, ELECTRIC, HYBRID }
enum TransmissionType { MANUAL, AUTOMATIC, CVT, AUTOMATED }

// Entidades
model VehicleBrand { ... }
model VehicleModel { ... } // @index([brandId])
model VehicleVersion { ... } // @index([modelId])
model VehicleYear { ... } // @index([versionId])
model PartCategory { ... } // @unique([slug])
```

---

## ⚡ Estratégia de Cache

Implementamos uma estratégia de **Cache-Aside (Look-aside)**:
1.  O sistema verifica o Redis por uma chave específica (ex: `catalog:brands`).
2.  **Hit**: Retorna dados instantaneamente (< 20ms).
3.  **Miss**: Consulta o banco, salva no Redis com TTL de 24h (86400s) e retorna.
4.  **Invalidação**: O Administrador pode limpar o cache via `/admin/catalog/cache/invalidate`.

---

## 📱 Interface de Usuário (The Digital Forge)

A UI do `VehicleSelector` utiliza o tema **Industrial Glassmorphism (Verde)**:
*   **Surface**: Transparência com Blur (`expo-blur`).
*   **Colors**: `#2D8C4E` (Brand) e `#4ADE80` (Vibrant).
*   **UX**:
    *   **Breadcrumbs**: Caminho visual da seleção (ex: Fiat > Uno).
    *   **Search**: Barra de busca com filtro local no catálogo já carregado.
    *   **Thumb Zone**: Navegação e seleção otimizadas para o uso com uma mão.

---

## ✅ Verificação e Testes

*   **Testes Unitários**: Localizados em `catalog.service.spec.ts`, validando a integração entre o serviço, Prisma e Redis.
*   **Audit Log**: O módulo respeita a política de segurança, exigindo tokens JWT para qualquer operação de escrita (Admin).
*   **Seed**: Script de seed popula automaticamente as 10 maiores marcas brasileiras (Fiat, VW, GM, etc).

---

## 🛠️ Guia de Uso

### Como limpar o cache via API:
```bash
POST /admin/catalog/cache/invalidate
Authorization: Bearer <ADMIN_TOKEN>
```

### Como usar o seletor no Mobile:
```tsx
import { VehicleSelector } from '../components/Catalog';

<VehicleSelector onSelect={(selection) => console.log(selection)} />
```

---
**Status da Implementação**: 🟢 Concluído
**Versão**: 1.0.0
**Data**: 23/04/2026
