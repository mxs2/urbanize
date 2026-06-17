# Urbanize

> Plataforma de gestão de demandas urbanas com backend real, banco persistente e diferenciação de perfis (Cidadão e Gestor)

<img width="1917" height="985" alt="image" src="https://github.com/user-attachments/assets/39b854b8-b572-40cb-8177-8a01f822b2ab" />


**Stack:** Next.js 16 • TypeScript • Chakra UI • Zustand • TensorFlow.js/MobileNet • Node.js • Express • Prisma ORM • JWT • Cookies • Redis opcional • Cron Jobs

## Início rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env no diretório backend a partir do .env.example

# Linux/macOS
cp backend/.env.example backend/.env

# Windows (PowerShell)
Copy-Item backend/.env.example backend/.env

# Gerar o Prisma Client
npx prisma generate

# Preparar banco local
npm run db:migrate
npm run db:seed

# Rodar backend Express
npm run dev:backend

# Rodar frontend
npm run dev:frontend

# Acessar
http://127.0.0.1:4100
```

**Credenciais de teste:**
- Cidadão: `cidadao@urbanize.com` / `demo`
- Gestor: `gestor@urbanize.com` / `demo`

**Backend:** `http://localhost:4000/api`  
**Frontend:** `http://127.0.0.1:4100`

<details>
<summary>Scripts disponíveis</summary>

- `npm run dev:frontend` - Servidor Next.js de desenvolvimento
- `npm run dev:backend` - API Express com Prisma, JWT, Redis opcional e cron
- `npm run db:migrate` - Criar/aplicar migrações Prisma
- `npm run db:seed` - Popular usuários e demandas de demonstração

</details>

<details>
<summary>Solução de problemas</summary>

**Erro ao executar o seed:**

```bash
Cannot find module '../src/generated/prisma/client'
```

Gere novamente o Prisma Client:

```bash
npx prisma generate
npm run db:seed
```

**Porta ocupada:**

```bash
lsof -ti tcp:4100 | xargs kill
```

**Mudar porta:**

```bash
npm run dev -- --hostname 127.0.0.1 --port 4101
```

</details>

## Funcionalidades principais

### Autenticação e perfis

O perfil do usuário é definido no cadastro e validado no backend:

- **Cidadão** → cria e acompanha suas próprias demandas
- **Gestor público** → visualiza a fila geral, revisa triagens e altera status

A autenticação usa senha com hash, JWT, cookie HTTP-only e proteção por perfil.

<img width="1914" height="965" alt="image" src="https://github.com/user-attachments/assets/edbef56e-8f49-4c60-a1c5-c9c2a5d731ed" />

### Perfil Cidadão

**Permissões:**
- ✅ Criar novas demandas
- ✅ Visualizar suas próprias demandas
- ✅ Acompanhar status e timeline
- ✅ Consultar métricas pessoais
- ❌ Alterar status de demandas
- ❌ Acessar painel do gestor

**Navegação:**
- `/dashboard` - Visão geral pessoal
- `/demandas` - Minhas demandas
- `/demandas/nova` - Criar nova demanda
- `/demandas/:id` - Detalhes da demanda

Na home, o CTA "Registrar demanda" direciona para `/login?next=/demandas/nova`; após autenticação, o cidadão segue para a tela de criação.

<details>
<summary>Ver jornada completa do cidadão</summary>

Consulte a [documentação de jornadas](docs/jornada-usuario.md) para fluxos detalhados, permissões e cenários de teste.

</details>

### Perfil Gestor

**Permissões:**
- ✅ Visualizar demandas do seu órgão ou, quando sem vínculo, a fila geral
- ✅ Alterar status de demandas
- ✅ Adicionar observações
- ✅ Revisar triagem automática
- ✅ Visualizar métricas gerais
- ❌ Criar novas demandas

**Navegação:**
- `/gestor` - Painel de gestão
- `/demandas` - Demandas visíveis ao gestor
- `/demandas/:id` - Gerenciar demanda

<img width="1917" height="994" alt="image" src="https://github.com/user-attachments/assets/01d549a9-9f3f-434f-aa5f-494a8b9870b5" />

<img width="1912" height="993" alt="image" src="https://github.com/user-attachments/assets/c90cbfa2-dc45-4fb4-a970-71405e20ba65" />

<details>
<summary>Ver jornada completa do gestor</summary>

Consulte a [documentação de jornadas](docs/jornada-usuario.md) para fluxos detalhados, permissões e cenários de teste.

</details>

### Proteção de rotas

O sistema implementa controle de acesso automático:

- Usuários não autenticados → Redirecionados para `/login`
- Cidadão tentando acessar `/gestor` → Redirecionado para `/dashboard`
- Gestor tentando acessar `/dashboard` ou `/demandas/nova` → Redirecionado para `/gestor`

### Triagem inteligente

Fluxo atual de triagem:
- Upload de foto na criação da demanda
- Classificação local no navegador com TensorFlow.js/MobileNet
- Fallback no backend com Google Vision quando `GOOGLE_APPLICATION_CREDENTIALS_JSON` estiver configurado
- Rótulos exibidos: **Buraco na rua**, **Lixo acumulado na rua** e **Poste ou fiação caída**
- Sugestão de órgão responsável conforme categoria detectada e cadastro de órgãos
- Título e descrição preenchidos automaticamente após análise da imagem
- Histórico inicial da demanda gravado no banco sem expor links técnicos de contato

## Estrutura do projeto

```
frontend/src/
├── app/                    # Páginas Next.js (App Router)
│   ├── api/               # Rotas legadas da etapa 1
│   ├── cadastro/          # Página de cadastro
│   ├── dashboard/         # Dashboard do cidadão
│   ├── demandas/          # Criação, listagem e detalhes
│   ├── gestor/            # Painel do gestor
│   └── login/             # Página de login
├── components/            # Componentes React
│   ├── auth/             # Proteção de rotas
│   ├── dashboard/        # Cards de métricas
│   ├── demandas/         # Cards, filtros, timeline
│   ├── forms/            # Formulários e upload de imagem
│   ├── layout/           # Navbar, footer, layout
│   └── ui/               # Badges, títulos
├── services/             # Cliente HTTP e services do frontend
├── store/                # Zustand stores
├── types/                # TypeScript types
└── utils/                # Classificação, labels e auxiliares

backend/src/
├── app.ts                 # Middlewares e rotas Express
├── server.ts              # Bootstrap do servidor
├── config/                # Variáveis, Prisma e Redis
├── controllers/           # Entrada HTTP e validação
├── services/              # Regras de negócio e triagem
├── repositories/          # Acesso ao banco
├── routes/                # Endpoints REST
├── middlewares/           # Auth, upload e erros
└── utils/                 # Mappers e erros
```

<details>
<summary>Ver estrutura detalhada</summary>

**Stores (Zustand):**
- `authStore` - Autenticação e usuário (com persist)
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

</details>

## Documentação

📌 **[Requisitos da disciplina — Fundamentos de Computação Concorrente, Paralela e Distribuída](docs/requisitos-disciplina-projetos.md)**  
Mapeamento dos requisitos avaliados: arquitetura distribuída, diagrama, concorrência/paralelismo e otimização

📖 **[Documentação da API](docs/api.md)**  
Endpoints REST, autenticação, permissões, payloads, exemplos de resposta e variáveis de ambiente

📖 **[Avaliação 2 — Backend real](docs/avaliacao-2-backend.md)**  
Arquitetura Express, Prisma, autenticação JWT, Redis opcional, cron jobs e endpoints

📖 **[Jornadas e Perfis de Usuário](docs/jornada-usuario.md)**  
Fluxos detalhados, permissões, matriz de proteção de rotas e guia de testes

📋 **[Requisitos da Avaliação 1](docs/requisitos-urbanize.md)**  
Checklist completo de conformidade com todos os requisitos implementados

## Recursos técnicos

**Frontend:**
- Next.js 16.2.4 (App Router)
- TypeScript 5.7.3 (strict mode)
- Chakra UI 2.10.9 (sistema de design)
- Tailwind CSS 4.2.2
- React 18.3.1

**Estado e dados:**
- Zustand 5.0.12 (gerenciamento de estado)
- Axios 1.15.2 (cliente HTTP)
- SQLite via Prisma (persistência local)

**Qualidade:**
- ESLint 9.39.4
- TypeScript strict mode
- Componentes de feedback (loading/error/empty)
- Validação de formulários

**Design:**
- Totalmente responsivo (mobile, tablet, desktop)
- Sistema de cores customizado
- Tema claro customizado com Chakra UI
- Acessibilidade (ARIA labels)

<details>
<summary>Dependências completas</summary>

```json
{
  "next": "16.2.4",
  "react": "18.3.1",
  "express": "^5.2.1",
  "@prisma/client": "^7.8.0",
  "@prisma/adapter-better-sqlite3": "^7.8.0",
  "@chakra-ui/next-js": "^2.4.2",
  "@tensorflow-models/mobilenet": "^2.1.1",
  "@tensorflow/tfjs": "^4.22.0",
  "bcryptjs": "^3.0.3",
  "exifr": "^7.1.3",
  "jsonwebtoken": "^9.0.3",
  "ioredis": "^5.10.1",
  "node-cron": "^4.2.1",
  "@chakra-ui/react": "2.10.9",
  "zustand": "5.0.12",
  "axios": "1.15.2",
  "typescript": "5.7.3"
}
```

</details>

## Notas de desenvolvimento

**API real:**  
A aplicação usa backend Express em `backend/src`, persistência Prisma/SQLite e autenticação JWT. O Redis é opcional para cache de métricas e o cron consolida snapshots periódicos em `MetricsSnapshot`.

**Perfis:**  
O perfil é definido no cadastro e armazenado no banco. O backend valida permissões por rota e impede alterações de status por cidadãos.

**Proteção de rotas:**  
Componente `RoleProtectedRoute` em `frontend/src/components/auth/` verifica autenticação e permissões antes de renderizar páginas protegidas.

**Estados visuais:**  
Todos os componentes de lista implementam loading states (skeleton), empty states e error states para melhor UX.

## Avaliação 2 - Status

✅ **Backend funcional:** Express organizado em rotas, controllers, services e repositories  
✅ **Banco persistente:** Prisma ORM com SQLite e migrações  
✅ **Autenticação real:** Cadastro, login, JWT, cookie e logout  
✅ **Perfis:** Cidadão e gestor com permissões distintas  
✅ **CRUD principal:** Demandas com filtros, detalhe, criação e alteração de status  
✅ **Upload de imagem:** Anexo de foto, armazenamento local e URL `/uploads/...`  
✅ **Integração frontend + backend:** Services usam Axios para consumir API real  
✅ **Redis opcional:** Cache de métricas quando `REDIS_URL` está configurado  
✅ **Cron opcional:** Snapshot periódico de métricas  

## Avaliação 1 - Status

✅ **Stack obrigatória:** Next.js, TypeScript, Chakra UI  
✅ **10 funcionalidades MVP:** Todas implementadas  
✅ **Páginas obrigatórias:** Home, Login, Cadastro, Dashboard, Gestor, Demandas  
✅ **Extras:** Diferenciação de perfis, proteção de rotas, upload de fotos, triagem por imagem, métricas  
✅ **Responsividade:** Mobile, tablet e desktop  
✅ **Estados de feedback:** Loading, error, empty em todas as listas

Consulte [docs/requisitos-urbanize.md](docs/requisitos-urbanize.md) para checklist completo.

## Demo e Deploy

**Frontend (Vercel):** https://urbanize-eta.vercel.app/

**Backend (Render):** https://urbanize-backend.onrender.com/api/health

> **Importante:** o backend está hospedado no plano gratuito do Render. Por isso, ele pode ficar inativo após alguns minutos sem uso. Antes de testar o sistema pelo frontend, abra primeiro o link do backend acima e aguarde aparecer:
>
> `{"success":true,"data":{"status":"ok"}}`
>
> Depois disso, acesse o frontend normalmente pela Vercel.

**Credenciais de teste:**
- Cidadão: `cidadao@urbanize.com` / `demo`
- Gestor: `gestor@urbanize.com` / `demo`

**Vídeo demonstrativo:** https://youtu.be/dMM8QEGGw1g

Relatório Evolutivo de Gerenciamento de Projetos: [Abrir relatório](<docs/Urbanize - Relatório Evolutivo de Gerenciamento de Projetos.md>)

