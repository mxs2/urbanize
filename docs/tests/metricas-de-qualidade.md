# Métricas de Qualidade — Urbanize

Complementa o [plano de testes](plano-de-testes.md). Define o que a pipeline
[`regressao.yml`](../../.github/workflows/regressao.yml) mede, por que mede e o que ficou de fora.
As métricas são calculadas por [`scripts/qualidade/relatorios.mjs`](../../scripts/qualidade/relatorios.mjs) a cada
execução do workflow (push, PR, agendamento diário e execução manual), sem intervenção manual.

## Contexto que guiou a escolha

- Produto: app mobile/web (Expo) + API REST (Express + Prisma), com público que inclui gestores públicos.
- Suítes existentes: unitários do mobile (Jest), API (Jest + Supertest e BDD com Cucumber) e E2E (Playwright).
- Testes especificados em [casos-de-teste.md](casos-de-teste.md) (TC01–TC94), ligados às histórias de
  [historias-de-usuario.md](historias-de-usuario.md), que têm prioridade MoSCoW.
- Objetivos: (1) não liberar versão com regressão, (2) saber quanto do que foi especificado já está automatizado,
  (3) dar ao stakeholder não técnico uma leitura de risco por funcionalidade.
- Restrição: equipe pequena, sem ferramenta paga (SonarCloud, Allure TestOps etc.), tudo dentro do GitHub Actions.

## Métricas selecionadas

| # | Métrica | Como é calculada | Meta | Relatório | Por que entrou |
| --- | --- | --- | --- | --- | --- |
| M1 | Taxa de aprovação | testes que passaram ÷ (executados − ignorados), geral e por suíte | 100% | técnico e negócio | É o sinal direto de regressão; qualquer valor abaixo de 100% bloqueia a liberação (objetivo 1). |
| M2 | Testes com falha (quantidade e lista) | casos com `<failure>`/`<error>` nos JUnit XML, com mensagem | 0 | técnico, issue | A equipe precisa saber *qual* teste quebrou e por quê, não só que algo quebrou. Alimenta a issue automática. |
| M3 | Status do Quality Gate | Reprovado se há falha ou job com erro; Atenção se cobertura da API abaixo da meta; senão Aprovado | Aprovado | técnico e negócio | Resume M1, M2 e M5 numa decisão (liberar ou não) legível por qualquer pessoa. |
| M4 | Casos de teste automatizados | TCs de `casos-de-teste.md` cujo ID aparece no nome de um teste executado ÷ 94 | 50% | técnico e negócio | Mede o avanço da automação contra o que foi planejado (objetivo 2), algo que a cobertura de código não mostra. |
| M5 | Cobertura de código da API | `coverage-summary.json` do Jest (linhas, statements, funções, branches) sobre `backend/src` | 70% de linhas | técnico (negócio vê só linhas) | A API concentra as regras de negócio e permissões; cobertura baixa ali indica áreas sem nenhuma verificação. |
| M6 | Cobertura de código do mobile | idem, para os arquivos exercitados pelos unitários | informativa | técnico | Mostrada para dar visibilidade, mas sem meta: o Jest só mede os arquivos que os testes importam, então o número não representa o app inteiro. |
| M7 | Risco por funcionalidade (HU) | cruza status dos TCs com a prioridade MoSCoW da HU: Crítico (Must com falha), Alto (falha em Should/Could, ou Must sem automação), Médio (automação abaixo de 50%), Baixo | 0 em Alto/Crítico | negócio (técnico mostra a rastreabilidade) | Traduz resultado de teste em linguagem de produto: o stakeholder vê *qual funcionalidade* está em risco (objetivo 3). |
| M8 | Tempo de execução | soma do tempo dos testes, por suíte, e os 8 testes mais lentos | informativa | técnico | Pipeline lenta desestimula rodar testes; os mais lentos mostram onde otimizar primeiro. |
| M9 | Tendência | histórico das últimas 30 execuções (status, aprovação, cobertura, % TCs), guardado no cache do Actions | informativa | técnico e negócio | Um número isolado não mostra se a qualidade melhora ou piora; a tendência mostra. |

As metas ficam no topo do script (`META`) e podem ser ajustadas pela equipe.

## Métricas descartadas

| Métrica | Por que ficou de fora |
| --- | --- |
| Taxa de testes instáveis (flaky) | O projeto roda com `retries: 0` e não reexecuta testes; sem reexecução não há como distinguir falha intermitente de falha real. Reavaliar se ativarem retries no Playwright. |
| Mutation score (Stryker) | Custo alto de execução (multiplica o tempo da suíte) e de configuração para o tamanho atual do projeto; agrega pouco enquanto a cobertura de casos (M4) ainda está baixa. |
| Densidade de defeitos / defeitos escapados para produção | Exige registro manual e consistente de bugs por origem e um ambiente de produção com usuários reais, que o projeto não tem. Não dá para coletar automaticamente. |
| MTTR (tempo médio de correção) | Depende de histórico longo de issues abertas/fechadas; com a abertura automática de issues agora existe a base, mas ainda não há volume para o número ser significativo. Candidata para uma próxima etapa. |
| Métricas DORA (lead time, frequência de deploy) | Não há deploy automatizado; medem o processo de entrega, não a qualidade do produto. |
| Desempenho e carga (tempo de resposta, throughput) | Não existem testes de carga no projeto; o tempo de E2E (M8) é o único proxy disponível. |
| Complexidade ciclomática / code smells / lint | Medem qualidade interna do código, não resultado de teste. Precisariam de ferramenta extra (SonarCloud) e o objetivo desta etapa é qualidade observada pelos testes. |
| Cobertura de código do app inteiro (mobile) | O Jest só instrumenta arquivos importados pelos testes; forçar `collectCoverageFrom` em todas as telas geraria um número muito baixo e enganoso, já que as telas são cobertas pelo E2E, que não mede cobertura. Por isso M6 é só informativa. |
| Número de testes executados como meta | Incentiva testes triviais para inflar o número; é mostrado como contexto, mas não tem meta. |

## Como cada métrica é coletada

1. Cada job de teste grava JUnit XML, logs e cobertura em `test-results/<suite>/` e publica como artefato
   `resultados-<suite>` (retenção de 30 dias):
   - Unitários: `jest-junit` + `--coverage` (json-summary e lcov) + log do console.
   - API: `jest-junit` (Jest), `--format junit` (Cucumber) + JSON do Cucumber + cobertura + logs.
   - E2E: reporter `junit` do Playwright + relatório HTML + traces/screenshots de falha + logs do backend e do app web.
2. O job **Qualidade** (roda sempre, mesmo se algum teste falhar) baixa todos os artefatos, restaura o histórico do cache,
   executa `scripts/qualidade/relatorios.mjs` e publica o artefato `relatorios-qualidade` (90 dias) com:
   `relatorio-tecnico.html`, `relatorio-negocio.html`, `metricas.json`, `historico.json`, `resumo.md` e `issue.md`.
   O resumo também aparece na página da execução (Job Summary).
3. Em falha na `main`, no agendamento ou em execução manual, o mesmo job abre uma issue com a etiqueta
   `falha-pipeline` (ou comenta na que já estiver aberta) listando os testes que falharam. Quando a regressão completa
   volta a passar, a issue é fechada automaticamente.

Para rodar localmente, gere os XML no mesmo layout (`test-results/unitarios`, `test-results/api`, `test-results/e2e`)
e execute:

```bash
node scripts/qualidade/relatorios.mjs test-results relatorios
```

## Evidências para a apresentação

- Workflow: aba **Actions** → *Regressão* → qualquer execução; o job *Qualidade* mostra o resumo das métricas.
- Artefatos: na mesma página, seção *Artifacts* (`resultados-unitarios`, `resultados-api`, `resultados-e2e`, `relatorios-qualidade`).
- Issue automática: aba **Issues**, filtro `label:falha-pipeline`. Para gerar uma de demonstração, crie uma branch com um
  teste quebrado e dispare o workflow manualmente nela (*Run workflow* → escolher a branch); depois corrija e rode de novo
  para ver a issue ser fechada.
