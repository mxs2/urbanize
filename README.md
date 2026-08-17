# Urbanize

> Plataforma de gestão de demandas urbanas com backend real, banco persistente e diferenciação de perfis (Cidadão e Gestor)

**Stack:** Expo (React Native) • TypeScript • expo-router • Zustand • Node.js • Express • Prisma ORM • JWT • Redis opcional • Cron Jobs

> Este projeto era originalmente uma aplicação web (Next.js). O frontend foi removido e substituído por um app mobile (Expo/React Native) — veja o histórico do Git para a versão web.

## Início rápido (Docker)

```bash
./scripts/up.sh
```

O script gera `backend/.env`, `mobile/.env` e `docker/.env` (detectando o IP desta máquina na rede local e sorteando um `JWT_SECRET`), sobe a API e o Redis em containers, aplica as migrations e popula o banco de demonstração. Ao final a API responde em `http://localhost:4000/api` e no IP da rede local.

```bash
./scripts/down.sh          # para os containers
./scripts/down.sh -v       # para e apaga os volumes (força reinstalar e repovoar)
./scripts/setup-env.sh     # só regenera os .env (use --force ou --ip <endereço>)
```

O app mobile continua rodando no host, porque o Expo precisa de acesso direto ao dispositivo:

```bash
cd mobile
npm install
npm start
```

## Início rápido (sem Docker)

```bash
# Backend
cd backend
npm install
Copy-Item .env.example .env   # PowerShell (Linux/macOS: cp .env.example .env)
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev                    # API em http://localhost:4000/api

# App mobile (em outro terminal)
cd mobile
npm install
Copy-Item .env.example .env    # ajuste EXPO_PUBLIC_API_URL se necessário
npm start                      # abre o Expo Dev Tools (emulador, dispositivo físico ou navegador)
```

**Credenciais de teste:**
- Cidadão: `cidadao@urbanize.com` / `demo`
- Gestor: `gestor@urbanize.com` / `demo`

**Backend:** `http://localhost:4000/api`

<details>
<summary>Configurando EXPO_PUBLIC_API_URL</summary>

O app mobile precisa apontar para o endereço do backend acessível pelo dispositivo/emulador usado:

- **iOS Simulator / web:** `http://127.0.0.1:4000/api` (padrão)
- **Android Emulator:** `http://10.0.2.2:4000/api`
- **Dispositivo físico:** `http://<IP-da-máquina-na-rede-local>:4000/api`

Configure em `mobile/.env` (a partir de `mobile/.env.example`).

</details>

<details>
<summary>Scripts disponíveis</summary>

**Backend (`backend/`):**
- `npm run dev` - API Express com Prisma, JWT, Redis opcional e cron
- `npm run db:migrate` - Criar/aplicar migrações Prisma
- `npm run db:seed` - Popular usuários e demandas de demonstração
- `npm test` - Testes de aceitação (Jest + Supertest)
- `npm run test:bdd` - Cenários BDD (Cucumber)

**Mobile (`mobile/`):**
- `npm start` - Abre o Expo Dev Tools
- `npm run android` / `npm run ios` / `npm run web` - Roda em uma plataforma específica
- `npm run typecheck` - Verificação de tipos TypeScript
- `npm run lint` - ESLint (eslint-config-expo)
- `npm test` - Testes unitários (Jest)

</details>

<details>
<summary>Solução de problemas</summary>

**Erro ao executar o seed:**

```bash
Cannot find module '../generated/prisma/client'
```

Gere novamente o Prisma Client:

```bash
npx prisma generate
npm run db:seed
```

**App mobile não consegue falar com o backend:**

Confira `EXPO_PUBLIC_API_URL` em `mobile/.env` — veja a seção acima sobre emulador Android vs. dispositivo físico vs. simulador iOS.

</details>

## Funcionalidades principais

### Autenticação e perfis

O perfil do usuário é definido no cadastro e validado no backend:

- **Cidadão** → cria e acompanha suas próprias demandas
- **Gestor público** → visualiza a fila geral, revisa triagens e altera status

A autenticação usa senha com hash, JWT e proteção por perfil. O app mobile mantém a sessão via token Bearer (persistido com AsyncStorage), sem depender de cookies.

### Perfil Cidadão

**Permissões:**
- ✅ Criar novas demandas
- ✅ Visualizar suas próprias demandas
- ✅ Acompanhar status e timeline
- ✅ Consultar métricas pessoais
- ❌ Alterar status de demandas
- ❌ Acessar painel do gestor

**Telas:**
- Início — visão geral pessoal e métricas
- Minhas demandas — listagem com filtros
- Nova demanda — criação com foto, localização e triagem automática
- Detalhes da demanda — status e histórico

<details>
<summary>Ver jornada completa do cidadão</summary>

Consulte a [documentação de jornadas](docs/jornada-usuario.md) para fluxos detalhados, permissões e cenários de teste (referência histórica da versão web — a lógica de permissões é a mesma no app mobile).

</details>

### Perfil Gestor

**Permissões:**
- ✅ Visualizar a fila geral de demandas
- ✅ Alterar status de demandas
- ✅ Adicionar observações
- ✅ Revisar triagem automática
- ✅ Visualizar métricas gerais
- ❌ Criar novas demandas

**Telas:**
- Painel — métricas, fila de triagem inteligente e fila recente
- Demandas — todas as demandas visíveis ao gestor
- Detalhes da demanda — ações de triagem (mudança de status, observações)

<details>
<summary>Ver jornada completa do gestor</summary>

Consulte a [documentação de jornadas](docs/jornada-usuario.md) para fluxos detalhados, permissões e cenários de teste (referência histórica da versão web — a lógica de permissões é a mesma no app mobile).

</details>

### Proteção de rotas

O app implementa controle de acesso automático (`mobile/src/hooks/useRoleGuard.ts`):

- Usuário não autenticado → redirecionado para a tela de login
- Cidadão tentando acessar o painel do gestor → redirecionado para o início
- Gestor tentando acessar telas exclusivas do cidadão (ex.: nova demanda) → redirecionado para o painel

### Triagem inteligente

Fluxo de triagem no app mobile:
- Foto anexada via câmera ou galeria (`expo-image-picker`) na criação da demanda
- Upload para o backend, que classifica a imagem com Google Vision (`GOOGLE_APPLICATION_CREDENTIALS_JSON`) quando configurado
- Sugestão de órgão responsável conforme categoria detectada e cadastro de órgãos
- Título e descrição preenchidos automaticamente após a análise
- Histórico da demanda gravado no banco

> A versão web anterior também classificava a imagem localmente no navegador com TensorFlow.js/MobileNet como um pré-preenchimento client-side. Esse passo não foi portado para o mobile: a classificação do backend via Google Vision já cobre o mesmo papel (com fallback para a categoria escolhida manualmente quando o Vision não está configurado), e evita embutir um modelo de ML pesado no app.

## Estrutura do projeto

```
mobile/
├── app/                      # Rotas (expo-router, file-based)
│   ├── index.tsx            # Home pública
│   ├── login.tsx
│   ├── cadastro.tsx
│   └── (app)/                # Grupo autenticado (guarda de rota + navegação)
│       ├── dashboard.tsx     # Início do cidadão
│       ├── gestor.tsx        # Painel do gestor
│       └── demandas/         # Listagem, detalhe e criação
├── src/
│   ├── components/           # UI kit (Button, TextField, Badge, DemandCard, ImageUpload…)
│   ├── hooks/                # useAuth, useDemands, useFilters, useMetrics, useRoleGuard
│   ├── services/             # Cliente HTTP (axios) e services por domínio
│   ├── store/                # Zustand stores (auth com persist via AsyncStorage)
│   ├── theme/                # Tokens de cor/espaçamento
│   ├── types/                # TypeScript types compartilhados
│   └── utils/                # Labels, formatação, detecção de perfil

backend/src/
├── app.ts                    # Middlewares e rotas Express
├── server.ts                 # Bootstrap do servidor
├── config/                   # Variáveis, Prisma e Redis
├── controllers/               # Entrada HTTP e validação
├── services/                  # Regras de negócio e triagem
├── repositories/              # Acesso ao banco
├── routes/                    # Endpoints REST
├── middlewares/                # Auth, upload e erros
└── utils/                     # Mappers e erros
```

<details>
<summary>Ver estrutura detalhada do app mobile</summary>

**Stores (Zustand):**
- `authStore` - Autenticação e usuário (persistido via AsyncStorage)
- `demandStore` - Demandas e filtros
- `uiStore` - Estado da UI

**Services:**
- `api.ts` - Cliente HTTP Axios integrado ao backend Express
- `authService.ts` - Login e registro
- `demandService.ts` - CRUD de demandas
- `metricsService.ts` - Métricas e estatísticas

**Hooks:**
- `useAuth` - Gerenciamento de autenticação
- `useDemands` - Gerenciamento de demandas
- `useFilters` - Filtros e busca
- `useMetrics` - Métricas e estatísticas
- `useRoleGuard` - Proteção de rotas por perfil

</details>

## Documentação

📌 **[Requisitos da disciplina — Fundamentos de Computação Concorrente, Paralela e Distribuída](docs/requisitos-disciplina-projetos.md)**
Mapeamento dos requisitos avaliados: arquitetura distribuída, diagrama, concorrência/paralelismo e otimização

📖 **[Documentação da API](docs/api.md)**
Endpoints REST, autenticação, permissões, payloads, exemplos de resposta e variáveis de ambiente

📖 **[Avaliação 2 — Backend real](docs/avaliacao-2-backend.md)**
Arquitetura Express, Prisma, autenticação JWT, Redis opcional, cron jobs e endpoints

📖 **[Jornadas e Perfis de Usuário](docs/jornada-usuario.md)**
Fluxos detalhados, permissões, matriz de proteção de rotas e guia de testes (documentação histórica da versão web)

📋 **[Requisitos da Avaliação 1](docs/requisitos-urbanize.md)**
Checklist completo de conformidade com todos os requisitos implementados (documentação histórica da versão web)

## Recursos técnicos

**Mobile:**
- Expo SDK 57 (React Native 0.86, React 19)
- expo-router (navegação baseada em arquivos)
- TypeScript (strict mode)
- expo-image-picker (câmera/galeria)

**Estado e dados:**
- Zustand (gerenciamento de estado)
- Axios (cliente HTTP)
- AsyncStorage (persistência de sessão)
- SQLite via Prisma no backend (persistência local)

**Qualidade:**
- ESLint (eslint-config-expo)
- TypeScript strict mode
- Componentes de feedback (loading/error/empty)
- Validação de formulários

## Notas de desenvolvimento

**API real:**
A aplicação usa backend Express em `backend/src`, persistência Prisma/SQLite e autenticação JWT. O Redis é opcional para cache de métricas e o cron consolida snapshots periódicos em `MetricsSnapshot`.

**Perfis:**
O perfil é definido no cadastro e armazenado no banco. O backend valida permissões por rota e impede alterações de status por cidadãos.

**Proteção de rotas:**
Hook `useRoleGuard` em `mobile/src/hooks/` verifica autenticação e permissões antes de renderizar telas protegidas.

**Estados visuais:**
Todos os componentes de lista implementam loading states, empty states e error states para melhor UX.

## Status

✅ **Backend funcional:** Express organizado em rotas, controllers, services e repositories
✅ **Banco persistente:** Prisma ORM com SQLite e migrações
✅ **Autenticação real:** Cadastro, login, JWT e logout
✅ **Perfis:** Cidadão e gestor com permissões distintas
✅ **CRUD principal:** Demandas com filtros, detalhe, criação e alteração de status
✅ **Upload de imagem:** Anexo de foto via câmera/galeria, armazenamento local e triagem automática
✅ **App mobile:** Expo/React Native consumindo a API real via Axios
✅ **Redis opcional:** Cache de métricas quando `REDIS_URL` está configurado
✅ **Cron opcional:** Snapshot periódico de métricas

Consulte [docs/requisitos-urbanize.md](docs/requisitos-urbanize.md) para o checklist original da avaliação (versão web).

## Deploy

**Backend (Render):** https://urbanize-backend.onrender.com/api/health

> O backend está hospedado no plano gratuito do Render e pode ficar inativo após alguns minutos sem uso — acesse o link acima antes de testar o app para "acordar" o serviço.

O app mobile não possui deploy público; rode-o localmente com Expo (veja "Início rápido" acima) apontando `EXPO_PUBLIC_API_URL` para o backend acima ou para sua instância local.

**Credenciais de teste:**
- Cidadão: `cidadao@urbanize.com` / `demo`
- Gestor: `gestor@urbanize.com` / `demo`
