# Testes E2E

Testes de ponta a ponta com [Playwright](https://playwright.dev/), rodando contra a versão web do
app (Expo Router com `react-native-web`). Eles usam o sistema pela interface, como um usuário.

## Cenários

`tests/fluxo-completo.spec.ts` (smoke) percorre o fluxo inteiro da entrega final:

1. Um cidadão novo cria a conta pela tela de cadastro.
2. Registra uma demanda com foto (escolhida na galeria) e coordenadas do GPS do navegador,
   escolhendo categoria e prioridade.
3. Na listagem, abre o painel de filtros e filtra por categoria e status.
4. O gestor entra, busca a demanda pelo protocolo e muda o status para "Em atendimento" com uma
   observação.
5. O cidadão volta ao app, recebe o aviso da mudança de status e, tocando nele, vê a demanda
   atualizada com a observação no histórico.

Cada etapa roda num contexto de navegador separado. O cidadão leva a sessão e o cache local de uma
etapa para a outra (`storageState`), como o mesmo celular reaberto; é a comparação com esse cache
que gera o aviso.

`tests/registrar-demanda.spec.ts` (smoke): o cidadão entra, abre "Nova demanda" pela barra de abas,
preenche título, descrição e endereço, aceita os termos, confere o protocolo `URB-XXXXX` no detalhe
e encontra a demanda em "Minhas demandas".

`tests/gestor-gerencia-demanda.spec.ts` (smoke): uma demanda criada pela API aparece na Triagem
Inteligente do gestor, que a leva de "Em análise" até "Resolvida", uma observação por etapa. No
fim, o cidadão autor vê o status "Resolvida".

`tests/gestor-aceita-triagem.spec.ts`: o gestor aceita a sugestão da triagem; a demanda sai da
fila, "Encaminhadas" sobe 1, "Em análise" desce 1 e o histórico mostra o encaminhamento.

`tests/triagem-gestor.spec.ts`: o cidadão registra pela interface e o gestor, em outra sessão,
aceita a triagem; depois de recarregar, a demanda continua fora da fila.

`tests/buscar-demandas.spec.ts`, `tests/filtrar-status.spec.ts`, `tests/cadastro-cidadao.spec.ts`
e `tests/registrar-demanda-responsivo.spec.ts` cobrem busca, filtro de status, cadastro e o
formulário em viewports de celular, tablet e desktop.

## Pré-requisitos

- Node.js 22 ou superior.
- Backend rodando com o banco populado pelo seed (`cidadao@urbanize.com` e `gestor@urbanize.com`,
  senha `demo`).
- `npm install` feito em `backend/`: antes de cada rodada, o `globalSetup` roda
  `backend/scripts/e2eCleanup.ts`, que apaga as demandas e os usuários criados por execuções
  anteriores.

## Instalação

```bash
cd e2e
npm install
npm run install-browsers   # baixa o Chromium usado nos testes
```

## Subindo o sistema

Em dois terminais, a partir da raiz do repositório:

```bash
# Terminal 1: API
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:4000/api

# Terminal 2: app web
cd mobile
npm install
npm run web                 # http://localhost:8081
```

## Executando

```bash
cd e2e
npm test                                        # todos, sem janela
npm run test:headed                             # com o navegador visível
npx playwright test tests/fluxo-completo.spec.ts   # um cenário
npm test -- --grep @smoke                       # só os smoke, como no pull request
```

Na primeira vez que o app web abre, o Metro ainda compila o bundle (cerca de 40 s) e o primeiro
teste pode estourar o tempo. Abra http://localhost:8081 no navegador uma vez antes de rodar.

Se o app ou a API estiverem em outro endereço:

```bash
WEB_URL=http://localhost:8081 API_URL=http://127.0.0.1:4000/api npm test
```

O relatório HTML fica em `e2e/playwright-report/` (`npx playwright show-report`).

## GIFs e vídeo do README

`npm run demo:gifs` roda o `fluxo-completo.spec.ts` gravando cada etapa em vídeo e converte as
gravações em `docs/media/1-cadastro.gif` a `5-notificacao.gif`. Precisa do sistema rodando, como
acima, e do `ffmpeg` no PATH. Rode de novo sempre que a interface mudar.
