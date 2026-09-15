# Como os testes estão organizados e como rodar cada um

Três níveis de automação no projeto. Cada um mora num lugar diferente, com sua própria
ferramenta e seu próprio comando — não tem um "rodar tudo" único porque as camadas testam
coisas diferentes (função isolada × API em memória × app real no navegador).

## Visão geral

| Nível | Onde fica | Ferramenta | O que testa |
| --- | --- | --- | --- |
| Unitário | [`tests/unit/`](../../tests/unit) | Jest (`jest-expo`) | Serviços do app mobile isolados (`api.ts`, `authService.ts`, `session.ts`), sem rede real |
| API / aceitação | [`tests/acceptance/`](../../tests/acceptance) | Jest + Supertest | Rotas do backend chamando `app` direto em memória — status code, contrato, autorização por perfil |
| BDD | [`tests/bdd/`](../../tests/bdd) | Cucumber | Cenários de login em Gherkin, mesma ideia de aceitação, formato legível por não-dev |
| E2E | [`e2e/`](../../e2e) | Playwright | App web de verdade (`expo start --web`) + backend de verdade — fluxo completo pela UI, como um usuário |

## 1. Testes unitários (mobile)

```bash
cd mobile
npm install
npm test
```

Não precisa de backend nem banco rodando — mocka a camada de rede.

**Se der `Cannot find module 'expo-modules-core'`:** já é um problema conhecido e corrigido em
[`mobile/jest.config.js`](../../mobile/jest.config.js) (peer dependency conflito com
`react-native-worklets` deixa o pacote aninhado em vez de na raiz do `node_modules`; o config
já aponta pro caminho certo). Se aparecer de novo depois de reinstalar dependências, é o mesmo
motivo.

## 2. Testes de API / aceitação (backend)

```bash
cd backend
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm test
```

Resultado esperado: `Test Suites: 5 passed, 5 total` / `Tests: 44 passed, 44 total`.

Rodar um arquivo específico:

```bash
npx jest tests/acceptance/02_demands.test.ts
```

**Importante:** o script `test` do backend usa `--runInBand` (roda os arquivos em série, não em
paralelo). É proposital — os testes escrevem no mesmo arquivo SQLite (`dev.db`), e workers
paralelos do Jest disputando o mesmo arquivo causam falhas intermitentes por contenção. Não tire
essa flag.

Helpers reutilizáveis ficam em `tests/acceptance/helpers/`:
- `authHelper.ts` — sessões prontas de cidadão/gestor e criação de usuário único descartável.
- `testDb.ts` — acesso ao Prisma Client e limpeza de dados de teste.

## 3. BDD (backend)

```bash
cd backend
npm run test:bdd
```

## 4. Testes E2E (produto completo)

Precisa do backend **e** do app web rodando de verdade, em terminais separados:

```bash
# Terminal 1 — API
cd backend
npm run dev                 # http://localhost:4000/api

# Terminal 2 — App web
cd mobile
npm run web                  # http://localhost:8081

# Terminal 3 — testes
cd e2e
npm install
npm run install-browsers     # só na primeira vez
npm test
```

Ver rodando no navegador (bom pra demonstração):

```bash
npm run test:headed
SLOWMO=800 npm run test:headed   # mais devagar, dá pra acompanhar cada passo
```

Antes de cada execução, `e2e/global-setup.ts` roda `backend/scripts/e2eCleanup.ts`, que apaga
demandas de execuções anteriores do teste (filtra pelo título usado no cenário) — a listagem não
fica acumulando repetição a cada rodada.

Cenário automatizado: [`e2e/tests/registrar-demanda.spec.ts`](../../e2e/tests/registrar-demanda.spec.ts)
— login de cidadão, navegação até "Nova demanda" pela tab bar, preenchimento do formulário,
aceite dos termos, submissão, confirmação do protocolo gerado e verificação de que a demanda
aparece em "Minhas demandas". Detalhes de setup em [`e2e/README.md`](../../e2e/README.md).

## Como os níveis se complementam

- **Unitário** garante que cada serviço isolado (parsing de resposta, guarda de sessão) se
  comporta certo antes de qualquer coisa integrar.
- **API** cobre a maior parte do risco de negócio (autorização por perfil, regras de status,
  contrato da API) rápido e sem depender de UI — é onde a maioria dos casos de teste vive.
- **E2E** prova que app e API realmente conversam do jeito que o usuário usa, algo que nenhum
  teste isolado consegue garantir sozinho — mas é caro de rodar e manter, por isso cobre só as
  jornadas críticas, não cada variação de regra de negócio (essas já estão na camada de API).
