# Como os testes estão organizados e como rodar cada um

O Urbanize tem três níveis de testes automatizados: unitários, API e ponta a ponta (E2E). Os cenários BDD fazem parte dos testes de API e descrevem comportamentos em Gherkin.

| Nível | Onde fica | Ferramenta | O que cobre |
| --- | --- | --- | --- |
| Unitário | [`tests/unit/`](../../tests/unit) | Jest com `jest-expo` | Serviços do app mobile, como autenticação, sessão e tratamento de respostas, com a rede simulada |
| API | [`tests/acceptance/`](../../tests/acceptance) | Jest e Supertest | Contratos das rotas, autorização por perfil e regras de negócio |
| API (BDD) | [`tests/bdd/`](../../tests/bdd) | Cucumber | Cenários de aceitação escritos em Gherkin |
| E2E | [`e2e/`](../../e2e) | Playwright | Jornadas pela interface web, com o backend e o banco de testes em execução |

## Execução local com um comando

Com Node.js 24 e Bash, execute na raiz do repositório:

```bash
bash scripts/testes.sh
```

O script instala as dependências, prepara o SQLite com os dados de teste e roda os testes unitários, de API e BDD. Ele retorna código `1` se alguma dessas etapas falhar. Para executar a suíte E2E, siga a seção [Testes E2E](#4-testes-e2e).

Os logs e relatórios JUnit são gravados em `test-results/unitarios/` e `test-results/api/`. A pasta `test-results/` está no [`.gitignore`](../../.gitignore) e pode ser consultada depois da execução local.

## 1. Testes unitários

Execute a partir da raiz do repositório:

```bash
cd mobile
npm ci
npm test
```

A suíte simula a camada de rede e pode ser executada sem iniciar o backend ou o banco. Se o Jest acusar `Cannot find module 'expo-modules-core'`, confira [`mobile/jest.config.js`](../../mobile/jest.config.js). O arquivo configura a resolução do pacote quando ele fica instalado dentro de `node_modules/expo/node_modules`.

## 2. Testes de API

Na primeira execução, prepare o ambiente local. Se `backend/.env` já existir, preserve a configuração existente e confira se ela aponta para o banco SQLite de testes.

```bash
cd backend
npm ci
[ -f .env ] || cp .env.example .env
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm test
```

Para rodar apenas os testes de demandas, execute dentro de `backend/`:

```bash
npm test -- --runTestsByPath ../tests/acceptance/02_demands.test.ts
```

O script do backend usa `--runInBand` para executar as suítes em série. Como elas escrevem no mesmo arquivo SQLite, executá-las em paralelo pode causar falhas intermitentes por contenção.

Os [helpers de aceitação](../../tests/acceptance/helpers) incluem `authHelper.ts`, para sessões de cidadão e gestor e criação de usuários de teste, e `testDb.ts`, para acesso ao Prisma e limpeza dos dados.

## 3. Testes BDD

Com o ambiente do backend preparado conforme a seção anterior, execute a partir da raiz:

```bash
cd backend
npm run test:bdd
```

Os cenários ficam em [`tests/bdd/`](../../tests/bdd). O Cucumber usa a configuração de [`tests/cucumber.js`](../../tests/cucumber.js).

## 4. Testes E2E

Prepare o banco do backend seguindo a seção de testes de API. Depois, abra três terminais na raiz do repositório. Inicie a API e o app web antes de rodar a suíte.

**Terminal 1 — API em `http://localhost:4000/api`**

```bash
cd backend
npm run dev
```

**Terminal 2 — app web em `http://localhost:8081`**

```bash
cd mobile
npm ci
[ -f .env ] || cp .env.example .env
npm run web
```

**Terminal 3 — Playwright**

```bash
cd e2e
npm ci
npm run install-browsers
npm test
```

Para acompanhar os testes no Chromium ou executar apenas os cenários smoke, use os comandos abaixo dentro de `e2e/`:

```bash
npm run test:headed
SLOWMO=800 npm run test:headed
npm test -- --grep @smoke --grep-invert @quarentena
```

Antes de cada execução, o [`global-setup.ts`](../../e2e/global-setup.ts) chama [`e2eCleanup.ts`](../../backend/scripts/e2eCleanup.ts) para remover do banco local as demandas geradas em rodadas anteriores. Após a execução, abra o relatório HTML com `npx playwright show-report` a partir de `e2e/`.

| Spec | Cenário coberto |
| --- | --- |
| [`cadastro-cidadao.spec.ts`](../../e2e/tests/cadastro-cidadao.spec.ts) | Criação de conta pela tela de cadastro |
| [`registrar-demanda.spec.ts`](../../e2e/tests/registrar-demanda.spec.ts) | Registro de demanda e confirmação em **Minhas demandas** |
| [`registrar-demanda-responsivo.spec.ts`](../../e2e/tests/registrar-demanda-responsivo.spec.ts) | Registro em diferentes tamanhos de tela, sem rolagem horizontal |
| [`buscar-demandas.spec.ts`](../../e2e/tests/buscar-demandas.spec.ts) | Busca na listagem de demandas |
| [`filtrar-status.spec.ts`](../../e2e/tests/filtrar-status.spec.ts) | Filtro de demandas pelo status **Em análise** |
| [`gestor-aceita-triagem.spec.ts`](../../e2e/tests/gestor-aceita-triagem.spec.ts) | Aceite da sugestão de triagem e atualização de métricas e histórico |
| [`gestor-gerencia-demanda.spec.ts`](../../e2e/tests/gestor-gerencia-demanda.spec.ts) | Gestão da demanda até **Resolvida**, com confirmação pelo cidadão |
| [`triagem-gestor.spec.ts`](../../e2e/tests/triagem-gestor.spec.ts) | Registro pelo cidadão, aceite em outra sessão e persistência após recarregar a página |

## Pipeline no GitHub Actions

O workflow [Regressão](../../.github/workflows/regressao.yml) dispara suítes diferentes conforme o evento:

| Evento | Unitários | API (Jest e BDD) | E2E |
| --- | --- | --- | --- |
| Push em qualquer branch | Sim | Sim | — |
| Pull request para `main` | Sim | Sim | Cenários `@smoke` fora da quarentena |
| Execução diária, prevista para 02h UTC (23h do dia anterior em Brasília) | Sim | Sim | Suíte completa fora da quarentena |
| Execução manual | Sim | Sim | Suíte completa fora da quarentena |

Os cenários smoke cobrem o registro de demanda pelo cidadão e a gestão da demanda até a resolução. Nas execuções diárias e manuais, os testes marcados com `@quarentena` rodam em uma etapa separada que não bloqueia o pipeline. A [política de manutenção](../tas.md) descreve como tratar esses testes.

Para disparar a execução manual, abra **Actions → Regressão → Run workflow** e selecione a branch, quando o botão estiver disponível. O horário da execução diária é previsto e pode sofrer atrasos.

No CI, o app web é exportado com `npx expo export -p web` e servido como build estático na porta `8081`. O job **Qualidade** consolida os resultados e publica as métricas e as verificações de manutenção no resumo da execução.

## Logs, relatórios e evidências

No GitHub, abra **Actions → Regressão → execução desejada**. Clique no job para consultar a saída de cada etapa ou baixe os arquivos em **Artifacts**, no resumo da execução.

| Artefato | Conteúdo | Retenção configurada |
| --- | --- | --- |
| `resultados-unitarios` | `unitarios.log`, JUnit e cobertura | 30 dias |
| `resultados-api` | `jest.log`, `bdd.log`, relatórios JUnit e cobertura | 30 dias |
| `resultados-e2e` | Logs do Playwright, backend e app web, relatórios e evidências geradas | 30 dias |
| `relatorios-qualidade` | Métricas consolidadas e verificações da política de manutenção | 90 dias |

Para ver o relatório HTML do Playwright, baixe `resultados-e2e`, extraia o arquivo e abra `playwright-report/index.html`. Se a execução falhar antes de gerar o relatório, consulte os logs disponíveis no job **E2E**.

Quando for preciso manter uma evidência além do prazo de retenção, registre um resumo com a data, o commit testado, o resultado das suítes e o link da execução.
