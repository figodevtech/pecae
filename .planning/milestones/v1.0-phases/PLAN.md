# PLAN.md — Plano de Verificação da Fase 1

Este documento estabelece o plano detalhado de teste, verificação e validação para a **Milestone 1 (Sprint 1) — Fundações: Autenticação & Catálogo Automotivo**. O objetivo é garantir que todas as funcionalidades dos módulos **M01 — Autenticação e Cadastro** e **M04 — Catálogo Automotivo** estejam operacionais, seguras e em conformidade com as especificações estéticas e arquiteturais do PECAÊ.

---

## 1. Escopo de Verificação

### 1.1. M01 — Autenticação e Cadastro
- **Fluxo de E-mail/Senha**: Cadastro de usuário, validação com hash seguro, e-mail de verificação com token de uso único (expiração de 1h).
- **Recuperação de Senha**: Fluxo de esqueci a senha, envio de token seguro por e-mail e redefinição segura.
- **Autenticação OTP por Telefone**: Envio de código OTP via SMS (mockado no console/logger em desenvolvimento) e validação bem-sucedida.
- **Integração OAuth Google**: Fluxo de login e cadastro integrado à conta Google.
- **Segurança (Rate Limiting / Throttler)**: Proteção de força bruta nas rotas sensíveis:
  - Registro: Máximo 20 requisições por minuto.
  - Login: Máximo 10 requisições por minuto.
  - OTP Telefone: Máximo 3 requisições por minuto.
  - Google OAuth: Máximo 5 requisições por minuto.

### 1.2. M04 — Catálogo Automotivo
- **Endpoints Cascata (API)**: Rotas públicas para obter marcas de veículos, modelos associados a marcas, versões associadas a modelos e anos associados a versões.
- **Cache Agressivo com Redis**: Cache de 24h configurado em nível de serviço para as requisições do catálogo automotivo, com invalidação suportada.
- **Seletor de Veículo (Mobile)**: UI fluida baseada no design system **The Digital Forge** (Glassmorphism industrial):
  - Fluxo sequencial de passos: Marcas → Modelos → Versões → Anos.
  - Breadcrumbs dinâmicos e interativos para fácil navegação de retorno.
  - Feedback visual dos resultados disponíveis com base no filtro atual.

---

## 2. Preparação do Ambiente de Teste Local

Para rodar a verificação localmente e mitigar as lacunas identificadas no `RESEARCH.md`, siga os passos abaixo:

### 2.1. Configuração do Banco de Dados e Redis (Docker)
Como os testes e a execução local exigem o PostgreSQL e o Redis ativos, inicie-os em segundo plano:
```bash
# Subir apenas os contêineres de infraestrutura sem subir toda a aplicação no Docker
docker compose up -d database redis
```

### 2.2. Configuração de Variáveis de Ambiente (`.env`)
Certifique-se de que os arquivos de configuração locais estejam presentes para a execução fora do contêiner Docker se desejar depuração nativa:

1. **Na API (`apps/api/.env`)**:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pecae?schema=public"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   JWT_SECRET="pecae_development_jwt_secret_key_2026_super_secure"
   JWT_EXPIRES_IN="15m"
   JWT_REFRESH_SECRET="pecae_development_jwt_refresh_secret_key_2026_super_secure"
   JWT_REFRESH_EXPIRES_IN="7d"
   ```

2. **No Mobile (`apps/mobile/.env`)**:
   ```env
   EXPO_PUBLIC_API_URL="http://localhost:3000"
   ```

---

## 3. Plano de Testes Automatizados

Com as dependências instaladas (`npm install` concluído na raiz) e a infraestrutura local ativa, as suítes de testes automatizados podem ser executadas.

### 3.1. Testes de Unidade e Integração (API)
A API NestJS possui testes específicos cobrindo regras de negócio críticas.

- **Executar todos os testes da API**:
  ```bash
  npx.cmd turbo run test --filter=@pecae/api
  ```
- **Executar especificamente os testes de Autenticação**:
  ```bash
  npx.cmd jest apps/api/src/auth/auth.service.spec.ts
  ```
- **Executar especificamente os testes do Catálogo**:
  ```bash
  npx.cmd jest apps/api/src/catalog/catalog.service.spec.ts
  ```

### 3.2. Linter e Validação de Código
Para garantir que a base de código está limpa e segue os padrões de formatação:
```bash
npx.cmd turbo run lint --filter=@pecae/api
```

---

## 4. Plano de Verificação Manual (Walkthrough)

### 4.1. Verificação da API (Rest-Client ou cURL)

#### 4.1.1. Cadastro e Login (M01)
1. **Registrar Novo Usuário**:
   - Enviar POST para `http://localhost:3000/auth/register` com e-mail, senha e nome.
   - **Resultado Esperado**: Retorno do usuário cadastrado, senha criptografada no banco (verificar via Prisma Studio: `npx.cmd prisma studio` na pasta `apps/api`) e e-mail de verificação simulado no log.
2. **Login com Credenciais**:
   - Enviar POST para `http://localhost:3000/auth/login`.
   - **Resultado Esperado**: Retorno bem-sucedido contendo `accessToken` e `refreshToken`.
3. **Proteção de Rate Limiting (Throttler)**:
   - Enviar 11 requisições seguidas de login para `http://localhost:3000/auth/login`.
   - **Resultado Esperado**: A 11ª requisição deve retornar HTTP 429 (`Too Many Requests`), comprovando o funcionamento do Throttler.

#### 4.1.2. Consulta de Catálogo com Cache Redis (M04)
1. **Primeira Consulta de Marcas**:
   - Enviar GET para `http://localhost:3000/catalog/brands`.
   - **Resultado Esperado**: Lista de marcas populares inseridas pelo seed. Tempo de resposta típico: 50ms - 150ms (batendo no banco de dados).
2. **Segunda Consulta de Marcas (Cache Hit)**:
   - Enviar o mesmo GET para `http://localhost:3000/catalog/brands`.
   - **Resultado Esperado**: Resposta idêntica. Tempo de resposta típico: <10ms (retornado diretamente do cache Redis, sem queries adicionais no banco).

---

### 4.2. Verificação Mobile (React Native + Expo)

#### 4.2.1. Telas de Autenticação (M01)
1. **Inicialização do App**:
   - Inicie o aplicativo móvel (`npm run start` ou `npx.cmd expo start` na pasta `apps/mobile`).
   - Navegue pelo fluxo de autenticação: Tela de Login, Tela de Registro, e Telas de Esqueci a Senha / OTP.
   - **Resultado Esperado**: Renderização fluida, campos validados localmente (ex: e-mail inválido, senha muito curta) com transições dinâmicas.

#### 4.2.2. Seletor de Veículo Interativo (M04)
1. **Navegação do Seletor**:
   - Abra a tela do catálogo ou de criação de anúncio que contém o componente `VehicleSelector`.
   - **Passo 1 (Marca)**: Clique em "Fiat".
   - **Passo 2 (Modelo)**: A lista deve atualizar instantaneamente exibindo apenas modelos da Fiat (ex: Uno, Palio, Toro). Clique em "Uno".
   - **Passo 3 (Versão)**: A lista deve atualizar exibindo versões correspondentes. Selecione "1.0 Fire Flex".
   - **Passo 4 (Ano)**: Selecione o ano correspondente.
   - **Resultado Esperado**: Os breadcrumbs interativos no topo devem mostrar claramente o caminho: `Fiat > Uno > 1.0 Fire Flex > 2018`.
2. **Interatividade de Voltar / Limpar**:
   - Clique em "Uno" no breadcrumb.
   - **Resultado Esperado**: O seletor deve retornar reativamente para o passo de seleção de Versão, preservando a seleção de marca e modelo.
   - Clique no botão "Limpar".
   - **Resultado Esperado**: Toda a seleção deve ser resetada, retornando ao Passo 1 (Marcas).

---

## 5. Critérios de Aceitação (UAT)

Para que a **Fase 1** seja considerada formalmente concluída e aprovada, os seguintes critérios devem ser atingidos:
1. **[  ] 100% de Sucesso nos Testes da API**: As suítes de testes automatizados para os módulos `auth` e `catalog` devem rodar com sucesso.
2. **[  ] Throttler Operacional**: A proteção contra força bruta deve retornar o status HTTP 429 conforme as configurações.
3. **[  ] Latência Baixa com Redis**: Consultas repetidas de catálogo devem apresentar tempos de resposta consistentes abaixo de 15ms.
4. **[  ] UI 'The Digital Forge' Funcional**: O componente móvel de seleção deve operar sem travamentos, com breadcrumbs interativos e estado sincronizado reativamente com o backend.
