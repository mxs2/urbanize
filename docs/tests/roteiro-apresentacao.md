# Roteiro da apresentação — Testes Automatizados (U1 e U2)

Ordem da fala, item a item da rubrica, com o link do que abrir na tela.

**Onde a demonstração roda:** no fork [`elbedie/urbanize-tas`](https://github.com/elbedie/urbanize-tas). O GitHub
Actions da conta `mxs2` está bloqueado por cobrança desde 05/11 (registrado como falha de ambiente P1 na
[issue mxs2/urbanize#54](https://github.com/mxs2/urbanize/issues/54)). O fork é a contingência prevista na política de
manutenção: mesmo código, mesma pipeline, rodando numa conta sem bloqueio. O repositório oficial continua sendo
[`mxs2/urbanize`](https://github.com/mxs2/urbanize).

Atalhos: [Actions](https://github.com/elbedie/urbanize-tas/actions) ·
[Regressão](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) ·
[Pull requests](https://github.com/elbedie/urbanize-tas/pulls?q=is%3Apr) ·
[docs/tests](https://github.com/elbedie/urbanize-tas/tree/main/docs/tests)

## Resumo

| Bloco | Critério | Pontos | Onde está |
| --- | --- | --- | --- |
| U1 | Plano e modelagem de testes | 35 | [1](#1-u1--plano-e-modelagem-de-testes-35) |
| U1 | Testes automatizados executáveis e reprodutíveis | 40 | [2](#2-u1--testes-executáveis-e-reprodutíveis-40) |
| U1 | Backlog de automação | 25 | [3](#3-u1--backlog-de-automação-25) |
| U2 | Pipeline de testes e Continuous Testing | 40 | [4](#4-u2--pipeline-e-continuous-testing-40) |
| U2 | Suíte E2E sobre o app integrado | 30 | [5](#5-u2--suíte-e2e-sobre-o-app-integrado-30) |
| U2 | Métricas e resultados da automação | 30 | [6](#6-u2--métricas-e-resultados-30) |

---

## 1. U1 — Plano e modelagem de testes (35)

| Rubrica | O que mostrar | Link |
| --- | --- | --- |
| 1. Plano com escopo, níveis, riscos e pirâmide | Seções 1 (escopo), 2 (níveis com justificativa de cada incluído e excluído, e a pirâmide 11 / 72 / 8), 3 (riscos) | [plano-de-testes-e-backlog.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/plano-de-testes-e-backlog.md) · [plano-de-testes.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/plano-de-testes.md) |
| 2. Casos rastreáveis aos critérios de aceite | Histórias com critérios de aceite → 94 casos (TC01–TC94), cada um citando a HU; matriz de rastreabilidade (seção 4.5 do plano) | [historias-de-usuario.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/historias-de-usuario.md) · [casos-de-teste.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/casos-de-teste.md) |
| 3. Cobre os fluxos prioritários (registro e acompanhamento) | HU-03 (registrar demanda) e HU-04/HU-05 (acompanhar status e histórico) são *Must have* e concentram a maior parte dos casos | mesmos arquivos |

**Fala:** "O plano parte das histórias. Cada critério de aceite virou caso de teste com ID, e cada caso diz em que
nível é verificado. A pirâmide é mais larga em API porque é lá que estão as regras do sistema."

## 2. U1 — Testes executáveis e reprodutíveis (40)

| Rubrica | O que mostrar | Link |
| --- | --- | --- |
| 1. Unidade e API sobre o código real | 11 unitários do app (Jest) e 70 de API (Jest + Supertest) + 2 cenários BDD, chamando o backend real com SQLite | [tests/unit](https://github.com/elbedie/urbanize-tas/tree/main/tests/unit) · [tests/acceptance](https://github.com/elbedie/urbanize-tas/tree/main/tests/acceptance) · [tests/bdd](https://github.com/elbedie/urbanize-tas/tree/main/tests/bdd) |
| 2. Comando único, sem passos manuais, em outra máquina | `bash scripts/testes.sh` instala, prepara o banco com seed e roda os três níveis | [scripts/testes.sh](https://github.com/elbedie/urbanize-tas/blob/main/scripts/testes.sh) · [organizacao-e-execucao.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/organizacao-e-execucao.md) |
| 3. Resultado registrado | Logs e JUnit em `test-results/`; no CI, artefatos `resultados-unitarios` e `resultados-api` de cada execução | [execuções da Regressão](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) · [evidências da API](https://github.com/elbedie/urbanize-tas/tree/main/docs/evidencias-testes-api) |

**Demonstração ao vivo (opcional, ~2 min):** rodar `bash scripts/testes.sh` no terminal e mostrar
`Tests: 11 passed` / `Tests: 70 passed` / `2 scenarios (2 passed)` / `Tudo verde`.

## 3. U1 — Backlog de automação (25)

Tudo em [plano-de-testes-e-backlog.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/plano-de-testes-e-backlog.md):

| Rubrica | O que mostrar | Onde |
| --- | --- | --- |
| 1. Nível e justificativa de seleção por item | Tabela da seção 5: nível de cada caso e cálculo de retorno (tempo manual, custo de implementar e manter, frequência) | seção 5 |
| 2. Priorização com critério explícito | Seção 6: `prioridade = (Risco × Frequência) ÷ Custo`, escalas 1–3 definidas | seção 6 |
| 3. Rastreável aos casos do plano | Cada linha do backlog cita o `TCxx` e a HU; status espelha o [checklist de implementação](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/checklist-implementacao.md) | seção 6 |
| 4. O que ficou fora, com justificativa | "Fora de escopo (validação manual)" e os níveis excluídos (integração de sistemas, aceite) | [plano-de-testes.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/plano-de-testes.md) · seção 2 do plano |

## 4. U2 — Pipeline e Continuous Testing (40)

| Rubrica | O que mostrar | Link |
| --- | --- | --- |
| 1. Pipeline implementada e executando | Workflow `Regressão`: Unitários → API → E2E → Qualidade | [regressao.yml](https://github.com/elbedie/urbanize-tas/blob/main/.github/workflows/regressao.yml) · [execuções](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) |
| 2. Disparo automático por commit ou PR | Push em qualquer branch e PR para `main` disparam; regressão completa diária às 23h | [PR #1](https://github.com/elbedie/urbanize-tas/pull/1) e [PR #2](https://github.com/elbedie/urbanize-tas/pull/2) com os checks |
| 3. Resultado visível para o time | Checks no PR, Job Summary com as métricas, artefatos, badge no README, issue automática `falha-pipeline` | página de qualquer execução · [README](https://github.com/elbedie/urbanize-tas#readme) |

**Quality Gate:** PR com teste vermelho não entra na `main`. Evidência no repositório oficial:
[merge bloqueado](https://github.com/elbedie/urbanize-tas/blob/main/docs/evidencias-quality-gate/pr-42-merge-bloqueado-testes-falhando.png)
e [entrega do Quality Gate](https://github.com/elbedie/urbanize-tas/blob/main/docs/entrega-pipeline-quality-gate.md).

**Extra — manutenção da automação:** política em [tas.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tas.md)
e mecanismos em [entrega-politica-manutencao.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/entrega-politica-manutencao.md)
(check `Verificação da TAS`, detecção de testes instáveis, quarentena, revisão mensal). O bloqueio do Actions é o
caso real da demonstração ([issue #54](https://github.com/mxs2/urbanize/issues/54)).

## 5. U2 — Suíte E2E sobre o app integrado (30)

Playwright contra o app web (Expo) e a API reais, com banco SQLite e seed — sem mock.
Configuração: [playwright.config.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/playwright.config.ts) ·
[e2e/README.md](https://github.com/elbedie/urbanize-tas/blob/main/e2e/README.md).

| Rubrica | Teste | Link |
| --- | --- | --- |
| 1. Registrar | TC18, TC41: cidadão registra demanda e a vê na listagem | [registrar-demanda.spec.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/tests/registrar-demanda.spec.ts) |
| 1. Acompanhar | TC19, TC78, TC79: gestor conduz a demanda da triagem até Resolvida | [gestor-gerencia-demanda.spec.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/tests/gestor-gerencia-demanda.spec.ts) |
| 1. Notificar | TC78: gestor muda o status e o cidadão vê o aviso | [notificacao-status.spec.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/tests/notificacao-status.spec.ts) |
| 2. App integrado, sem mock | Backend e app web sobem no job E2E; logs dos dois vão no artefato `resultados-e2e` | job E2E da [regressão completa](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) |
| 3. Cenários negativos | Cidadão tenta acessar a área do gestor (redirecionado, API responde 403); demanda com endereço vazio (erro na tela, nenhum POST) | [cenarios-negativos.spec.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/tests/cenarios-negativos.spec.ts) |

**Na tela:** abrir a execução completa da Regressão → job E2E → artefato `resultados-e2e` (relatório HTML do Playwright).

## 6. U2 — Métricas e resultados (30)

| Rubrica | O que mostrar | Link |
| --- | --- | --- |
| 1. Relatório de métricas | `relatorio-tecnico.html`: aprovação por suíte, falhas, cobertura, testes mais lentos, tendência | artefato `relatorios-qualidade` da [regressão completa](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) |
| 2. Interpretação e riscos | `relatorio-negocio.html`: decisão (Aprovado / Atenção / Reprovado), **risco por funcionalidade** (HU × prioridade × situação) e recomendações. Hoje aponta HU-03, HU-07 e HU-09 com automação parcial | mesmo artefato |
| Por que essas métricas | 9 métricas com meta e motivo; métricas descartadas com justificativa | [metricas-de-qualidade.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/metricas-de-qualidade.md) |

**Fala:** "O relatório técnico é para o time; o de negócio traduz o resultado em risco por funcionalidade, para quem
decide se a versão sai."

---

## Ordem sugerida (~15 min)

1. Contexto e por que o fork (1 min).
2. Plano, casos e backlog — itens 1 e 3 (4 min).
3. Testes e comando único — item 2 (2 min).
4. Pipeline: PR com checks → execução completa → Job Summary — item 4 (3 min).
5. E2E: os três testes do fluxo e os negativos — item 5 (2 min).
6. Relatórios técnico e de negócio — item 6 (2 min).
7. Manutenção da automação e pendências (1 min).

## Pendências conhecidas

- Actions da conta `mxs2` bloqueado por cobrança ([#54](https://github.com/mxs2/urbanize/issues/54)); PRs
  [mxs2/urbanize#56](https://github.com/mxs2/urbanize/pull/56) e [mxs2/urbanize#57](https://github.com/mxs2/urbanize/pull/57)
  aguardam esse desbloqueio e aprovação no repositório oficial.
- 27 testes ainda sem `TCxx` no nome ([#55](https://github.com/mxs2/urbanize/issues/55), prazo 15/12).
- Automação parcial em HU-03, HU-07 e HU-09 (59 de 94 casos só com unitários e API, 62,8%, meta 50%; o número com
  E2E está no relatório da execução completa).
