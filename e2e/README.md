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

**`tests/gestor-gerencia-demanda.spec.ts`** — Gestor faz a triagem de uma demanda e conduz seu
atendimento até "Resolvida":

1. Pré-condição: um cidadão registra uma demanda pela API (`POST /api/demands`), já que o
   registro pela interface é coberto pelo cenário acima.
2. Login com credenciais de gestor demo e redirecionamento ao "Painel do gestor".
3. Verificação de que a nova demanda aparece na seção "Triagem Inteligente".
4. Navegação até "Demandas", busca pelo protocolo e abertura do detalhe da demanda.
5. Avanço do status Em análise → Encaminhada → Em atendimento → Resolvida, com uma observação em
   cada etapa, conferindo o status atual e o registro da observação no histórico.
6. Confirmação de que a listagem do gestor mostra a demanda como "Resolvida".
7. Logout, login como o cidadão que registrou a demanda e confirmação de que ele também vê o
   status "Resolvida" em "Minhas demandas".

**`tests/gestor-aceita-triagem.spec.ts`** — Gestor aceita a sugestão de encaminhamento da
Triagem Inteligente:

1. Pré-condição: um cidadão registra uma demanda pela API; o backend faz a triagem automática
   e sugere o órgão responsável com um grau de confiança.
2. Login com credenciais de gestor demo e leitura das métricas "Em análise" e "Encaminhadas".
3. Verificação de que a demanda aparece na "Triagem Inteligente" com o órgão sugerido e a
   confiança calculada pelo backend.
4. Clique em "Aceitar": a demanda sai da fila de triagem, "Encaminhadas" aumenta em 1 e
   "Em análise" diminui em 1.
5. Na "Fila recente", a demanda aparece como "Encaminhada"; no detalhe, o histórico mostra a
   triagem automática e o encaminhamento para o órgão sugerido.

## Pré-requisitos

- Node.js 24+ (mesma versão usada em `backend/` e `mobile/`).
- Backend rodando com banco de dados seedado (usuários demo `cidadao@urbanize.com` e
  `gestor@urbanize.com`, ambos com senha `demo`).
- `backend/` com `npm install` já feito (o teste usa o Prisma Client de lá pra limpar dados antigos, ver abaixo).

Antes de cada execução, a suíte remove automaticamente as demandas criadas por rodadas
anteriores dos testes (`backend/scripts/e2eCleanup.ts`, disparado via `globalSetup` do
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
npx playwright test tests/gestor-gerencia-demanda.spec.ts   # só um cenário
```

> Na primeira vez que o app web é aberto, o Metro ainda está compilando o bundle (~40s) e o
> primeiro teste pode estourar o timeout. Abra `http://localhost:8081` no navegador uma vez antes
> de rodar a suíte.

Se o app web ou a API estiverem em outra porta/host, sobrescreva com:

```bash
WEB_URL=http://localhost:8081 API_URL=http://127.0.0.1:4000/api npm test
```

O relatório HTML fica em `e2e/playwright-report/` (abrir com `npx playwright show-report`).
