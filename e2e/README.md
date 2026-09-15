# Urbanize — Suíte de Testes E2E

Testes end-to-end automatizados com [Playwright](https://playwright.dev/), executados contra a
versão web do app mobile (Expo Router + `react-native-web`), exercitando o sistema pela interface
como um usuário real.

## Cenário automatizado

**`tests/registrar-demanda.spec.ts`** — Cidadão registra uma nova demanda urbana:

1. Login com credenciais de cidadão demo.
2. Navegação até "Nova demanda" pela tab bar do app.
3. Preenchimento do formulário (título, descrição, endereço) e aceite dos termos.
4. Submissão e verificação do protocolo (`URB-XXXXX`) gerado na tela de detalhe.
5. Confirmação de que a nova demanda aparece na listagem "Minhas demandas".

## Pré-requisitos

- Node.js 24+ (mesma versão usada em `backend/` e `mobile/`).
- Backend rodando com banco de dados seedado (usuário demo `cidadao@urbanize.com` / `demo`).
- `backend/` com `npm install` já feito (o teste usa o Prisma Client de lá pra limpar dados antigos, ver abaixo).

Antes de cada execução, o teste remove automaticamente as demandas criadas por rodadas
anteriores dele mesmo (`backend/scripts/e2eCleanup.ts`, disparado via `globalSetup` do
Playwright), então a listagem não fica acumulando repetições.

## Instalação

```bash
cd e2e
npm install
npm run install-browsers   # baixa o Chromium usado pelos testes
```

## Subindo o SUT

Em dois terminais separados, a partir da raiz do repositório:

```bash
# Terminal 1 — API
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:4000/api

# Terminal 2 — App web
cd mobile
npm install
npm run web                  # http://localhost:8081
```

## Executando os testes

```bash
cd e2e
npm test                     # headless
npm run test:headed          # com navegador visível
```

Se o app web estiver em outra porta/host, sobrescreva com:

```bash
WEB_URL=http://localhost:8081 npm test
```

O relatório HTML fica em `e2e/playwright-report/` (abrir com `npx playwright show-report`).
