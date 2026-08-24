# Avaliação 2 — Backend real

## Stack implementada

- Node.js + Express para API REST (`backend/src`)
- Prisma ORM + SQLite para persistência local (`prisma/schema.prisma`)
- JWT com cookie HTTP-only e header `Authorization`
- Perfis `cidadao` e `gestor` com autorização por rota
- Upload de imagens com Multer e disponibilização em `/uploads`
- Triagem de imagem com Google Vision opcional e fallback para categoria enviada pelo frontend
- Redis opcional para cache de métricas
- Cron job opcional para snapshots periódicos de indicadores

## Arquitetura

```text
backend/src/
├── app.ts                 # middlewares e rotas Express
├── index.ts               # bootstrap do servidor
├── config/                # env, prisma, redis
├── controllers/           # entrada HTTP e validação
├── services/              # regras de negócio
├── repositories/          # acesso ao Prisma
├── routes/                # definição dos endpoints
├── middlewares/           # auth, upload e tratamento de erro
└── utils/                 # mappers e erros
```

## Endpoints principais

### Autenticação

- `POST /api/auth/register` — cadastra usuário
- `POST /api/auth/login` — autentica e grava cookie de sessão
- `GET /api/auth/me` — retorna usuário autenticado
- `POST /api/auth/logout` — encerra sessão

### Demandas

- `GET /api/demands` — lista demandas com filtros
- `POST /api/demands` — cria demanda do cidadão
- `GET /api/demands/:id` — detalhe da demanda
- `PATCH /api/demands/:id/status` — alteração de status apenas por gestor

### Upload

- `POST /api/upload/image` — recebe foto da demanda, salva em `/uploads` e retorna triagem de imagem

### Métricas

- `GET /api/metrics/summary` — consolida indicadores por status e categoria

## Regras de negócio

- Cidadão acessa apenas suas próprias demandas.
- Gestor acessa demandas do órgão vinculado; gestores sem vínculo veem a fila geral.
- Toda criação de demanda gera protocolo, histórico inicial e triagem automática.
- A triagem sugere órgão responsável a partir da categoria detectada e do cadastro de órgãos.
- O histórico exibe a triagem sem gravar links técnicos de contato no texto.
- Alteração de status registra histórico com autor e observação.
- Métricas de cidadão são escopadas ao próprio usuário; métricas de gestor respeitam o escopo do órgão quando houver vínculo.

## Redis

O Redis é opcional e está justificado para cache do endpoint de métricas (`metrics:summary:*`), pois é uma consulta frequente em dashboards e painéis de gestão. Se `REDIS_URL` não for configurado, a aplicação segue funcionando sem cache.

## Cron jobs

O cron `METRICS_CRON` executa periodicamente a consolidação de métricas em `MetricsSnapshot`, permitindo histórico de indicadores para relatórios futuros. Por padrão roda a cada 15 minutos.

## Execução local

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev:backend
npm run dev:frontend
```

Credenciais seed:

- Cidadão: `cidadao@urbanize.com` / `demo`
- Gestor: `gestor@urbanize.com` / `demo`
