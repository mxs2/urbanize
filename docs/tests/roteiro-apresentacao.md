# Apresentação — Testes Automatizados (U1 e U2)

**Urbanize — Cidade Conectada.** Este documento percorre a rubrica da disciplina na ordem: cada seção é um critério,
com o que foi feito e o link da evidência.

**Repositório da demonstração:** [`elbedie/urbanize-tas`](https://github.com/elbedie/urbanize-tas), fork do repositório
oficial [`mxs2/urbanize`](https://github.com/mxs2/urbanize). O GitHub Actions da conta `mxs2` está bloqueado por
cobrança desde 05/11. A política de manutenção trata isso como falha de ambiente com prioridade P1
([issue mxs2/urbanize#54](https://github.com/mxs2/urbanize/issues/54)). Pela política, a contingência é rodar a mesma
pipeline em outra conta. O fork tem o mesmo código e a mesma pipeline.

Atalhos: [Actions](https://github.com/elbedie/urbanize-tas/actions) ·
[Regressão](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) ·
[Pull requests](https://github.com/elbedie/urbanize-tas/pulls?q=is%3Apr) ·
[docs/tests](https://github.com/elbedie/urbanize-tas/tree/main/docs/tests)

| Bloco | Critério | Pontos |
| --- | --- | --- |
| U1 | [1. Plano e modelagem de testes](#1-plano-e-modelagem-de-testes--u1-35) | 35 |
| U1 | [2. Testes automatizados executáveis e reprodutíveis](#2-testes-executáveis-e-reprodutíveis--u1-40) | 40 |
| U1 | [3. Backlog de automação](#3-backlog-de-automação--u1-25) | 25 |
| U2 | [4. Pipeline de testes e Continuous Testing](#4-pipeline-e-continuous-testing--u2-40) | 40 |
| U2 | [5. Suíte E2E sobre o app integrado](#5-suíte-e2e-sobre-o-app-integrado--u2-30) | 30 |
| U2 | [6. Métricas e resultados da automação](#6-métricas-e-resultados--u2-30) | 30 |

---

## 1. Plano e modelagem de testes — U1 (35)

**O plano parte das histórias de usuário. Cada critério de aceite vira um caso de teste com ID, e cada caso tem um
nível de teste definido.**

| Critério | O que foi feito | Evidência |
| --- | --- | --- |
| Plano com escopo, níveis, riscos e pirâmide | Escopo (seção 1). Níveis com justificativa de cada nível incluído e excluído (seção 2). Pirâmide: 11 unitários, 72 de API e 8 E2E (seção 2). Riscos (seção 3) | [plano-de-testes-e-backlog.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/plano-de-testes-e-backlog.md) · [plano-de-testes.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/plano-de-testes.md) |
| Casos rastreáveis aos critérios de aceite | Histórias com critérios de aceite, 94 casos (TC01–TC94) citando a HU de origem e matriz de rastreabilidade (seção 4.5 do plano) | [historias-de-usuario.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/historias-de-usuario.md) · [casos-de-teste.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/casos-de-teste.md) |
| Cobre os fluxos prioritários | Registrar demanda (HU-03), acompanhar status e histórico (HU-04 e HU-05): são as histórias *Must have* e concentram a maior parte dos casos | mesmos arquivos |

A pirâmide é mais larga na API porque as regras do sistema estão no backend: validação, acesso por perfil, status e
histórico. O E2E fica só com os fluxos que precisam passar por app, API e banco juntos.

## 2. Testes executáveis e reprodutíveis — U1 (40)

**Os testes rodam sobre o código real e com um único comando, em qualquer máquina.**

| Critério | O que foi feito | Evidência |
| --- | --- | --- |
| Unidade e API sobre o código real | 11 unitários dos serviços do app (Jest). 70 testes de API (Jest + Supertest) e 2 cenários BDD (Cucumber) contra o backend real com SQLite e seed | [tests/unit](https://github.com/elbedie/urbanize-tas/tree/main/tests/unit) · [tests/acceptance](https://github.com/elbedie/urbanize-tas/tree/main/tests/acceptance) · [tests/bdd](https://github.com/elbedie/urbanize-tas/tree/main/tests/bdd) |
| Comando único, sem passos manuais | `bash scripts/testes.sh` instala as dependências, prepara o banco e roda os três níveis do mesmo jeito que o CI | [scripts/testes.sh](https://github.com/elbedie/urbanize-tas/blob/main/scripts/testes.sh) · [organizacao-e-execucao.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/organizacao-e-execucao.md) |
| Resultado registrado | Logs e JUnit em `test-results/`. No CI, os artefatos `resultados-unitarios` e `resultados-api` ficam guardados em cada execução | [execuções da Regressão](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) · [evidências da API](https://github.com/elbedie/urbanize-tas/tree/main/docs/evidencias-testes-api) |

Execução local mais recente (18/11): `Tests: 11 passed`, `Tests: 70 passed`, `2 scenarios (2 passed)`, saída
`Tudo verde`.

## 3. Backlog de automação — U1 (25)

**Automatizamos o que se paga dentro do prazo do projeto, na ordem de risco, frequência e custo.**

| Critério | O que foi feito | Onde |
| --- | --- | --- |
| Nível e justificativa por item | Cada caso tem nível e o cálculo de retorno: tempo manual, custo de implementar e de manter e frequência de execução | seção 5 do [plano](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/plano-de-testes-e-backlog.md) |
| Priorização com critério explícito | `prioridade = (Risco × Frequência) ÷ Custo`, com escalas de 1 a 3 definidas | seção 6 do plano |
| Rastreável aos casos do plano | Cada item do backlog cita o `TCxx` e a HU. O status acompanha o [checklist de implementação](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/checklist-implementacao.md) | seção 6 do plano |
| O que ficou fora, com justificativa | Validação manual (fora de escopo) e níveis excluídos: integração de sistemas e aceite | [plano-de-testes.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/plano-de-testes.md) · seção 2 do plano |

## 4. Pipeline e Continuous Testing — U2 (40)

**Todo commit e todo PR passam pela pipeline, e PR com teste vermelho não entra na `main`.**

| Critério | O que foi feito | Evidência |
| --- | --- | --- |
| Pipeline implementada e executando | Workflow `Regressão` com os jobs Unitários, API, E2E e Qualidade | [regressao.yml](https://github.com/elbedie/urbanize-tas/blob/main/.github/workflows/regressao.yml) · [execuções](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) |
| Disparo automático por commit ou PR | Push em qualquer branch e PR para a `main` disparam a pipeline. A regressão completa também roda todo dia às 23h | checks do [PR #1](https://github.com/elbedie/urbanize-tas/pull/1) e do [PR #2](https://github.com/elbedie/urbanize-tas/pull/2) |
| Resultado visível para o time | Checks no PR, Job Summary com as métricas, artefatos, badge no README e issue automática `falha-pipeline` quando a `main` quebra | página de qualquer execução · [README](https://github.com/elbedie/urbanize-tas#readme) |

**Quality Gate:** no repositório oficial, a regra da `main` exige os checks verdes. Evidências:
[merge bloqueado com teste falhando](https://github.com/elbedie/urbanize-tas/blob/main/docs/evidencias-quality-gate/pr-42-merge-bloqueado-testes-falhando.png)
e [entrega do Quality Gate](https://github.com/elbedie/urbanize-tas/blob/main/docs/entrega-pipeline-quality-gate.md).

**Manutenção da automação:** a política está em [tas.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tas.md)
e é aplicada pelo workflow
[`Manutenção da TAS`](https://github.com/elbedie/urbanize-tas/blob/main/.github/workflows/manutencao.yml):
- verificação em todo PR;
- classificação automática das issues de manutenção;
- cobrança de prazos;
- revisão mensal.

Detalhes em [entrega-politica-manutencao.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/entrega-politica-manutencao.md).

## 5. Suíte E2E sobre o app integrado — U2 (30)

**O fluxo registrar → acompanhar → notificar é testado de ponta a ponta, com app e backend reais, e inclui
cenários negativos.**

Playwright roda contra o app web (Expo) e a API reais, com banco SQLite e seed, sem mock.
Configuração: [playwright.config.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/playwright.config.ts) ·
[e2e/README.md](https://github.com/elbedie/urbanize-tas/blob/main/e2e/README.md).

| Critério | Teste | Evidência |
| --- | --- | --- |
| Registrar | TC18, TC41: o cidadão registra uma demanda e a vê na listagem | [registrar-demanda.spec.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/tests/registrar-demanda.spec.ts) |
| Acompanhar | TC19, TC78, TC79: o gestor conduz a demanda da triagem até Resolvida | [gestor-gerencia-demanda.spec.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/tests/gestor-gerencia-demanda.spec.ts) |
| Notificar | TC78: o gestor muda o status e o cidadão vê o aviso | [notificacao-status.spec.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/tests/notificacao-status.spec.ts) |
| App integrado, sem mock | Backend e app web sobem dentro do job E2E. Os logs dos dois vão no artefato `resultados-e2e`, com o relatório HTML do Playwright | job E2E da [regressão completa](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) |
| Cenários negativos | O cidadão tenta entrar na área do gestor: é redirecionado, e a API responde 403. Demanda com endereço vazio: o erro aparece na tela e nenhum POST é enviado | [cenarios-negativos.spec.ts](https://github.com/elbedie/urbanize-tas/blob/main/e2e/tests/cenarios-negativos.spec.ts) |

## 6. Métricas e resultados — U2 (30)

**A pipeline gera dois relatórios: um técnico, para o time, e outro de negócio, que mostra o risco por
funcionalidade.**

| Critério | O que foi feito | Evidência |
| --- | --- | --- |
| Relatório de métricas | `relatorio-tecnico.html`: aprovação por suíte, falhas com mensagem, cobertura de código, testes mais lentos, tendência e rastreabilidade por HU | artefato `relatorios-qualidade` da [regressão completa](https://github.com/elbedie/urbanize-tas/actions/workflows/regressao.yml) |
| Interpretação e riscos | `relatorio-negocio.html` traz três coisas: a decisão (Aprovado, Atenção ou Reprovado), o risco de cada funcionalidade (cruza resultado com prioridade da HU) e recomendações. Hoje aponta automação parcial em HU-03, HU-07 e HU-09 | mesmo artefato |
| Escolha das métricas | 9 métricas, cada uma com meta e motivo. As descartadas também têm justificativa | [metricas-de-qualidade.md](https://github.com/elbedie/urbanize-tas/blob/main/docs/tests/metricas-de-qualidade.md) |

Indicadores da última execução: 100% de aprovação, 0 falhas, 90,3% de cobertura de linhas da API (meta 70%),
62,8% dos casos automatizados contando só unitários e API (meta 50%) e nenhuma funcionalidade em risco alto ou
crítico.
