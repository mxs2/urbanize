# Entrega — Política de Manutenção

Este documento é o roteiro da entrega. Está organizado **na mesma ordem dos itens pedidos na atividade**: para cada
item mostra o que foi pedido, o que a equipe fez, as decisões com justificativa e onde está no repositório.

- **Política completa:** [`docs/tas.md`](tas.md), seções 2 (contexto) e 3 (política).
- **PR da entrega:** [mxs2/urbanize#56](https://github.com/mxs2/urbanize/pull/56).
- **Demonstração:** [issue 54](https://github.com/mxs2/urbanize/issues/54) e [issue 55](https://github.com/mxs2/urbanize/issues/55).

**Legenda:** ✅ completo · 🟡 implementado, aguardando condição externa (ver [Pendências](#pendências))

## Sumário

| Parte da atividade | Item pedido | Status | Seção deste documento |
| --- | --- | --- | --- |
| **1. Definição da política** | 1.1 Tratamento de falhas | ✅ | [1.1](#11-tratamento-de-falhas) |
| | 1.2 Critérios e prazos de correção | ✅ | [1.2](#12-critérios-e-prazos-de-correção) |
| | 1.3 Gestão de testes instáveis | ✅ | [1.3](#13-gestão-de-testes-instáveis) |
| | 1.4 Revisão periódica | ✅ | [1.4](#14-revisão-periódica) |
| | 1.5 Remoção de testes | ✅ | [1.5](#15-remoção-de-testes) |
| | 1.6 Decisões justificadas e registradas em `docs/tas.md` | ✅ | [1.6](#16-decisões-justificadas-e-registradas-na-tas) |
| **2. Implementação da política** | 2.1 Procedimentos incorporados ao fluxo da equipe no GitHub | ✅ | [2.1](#21-procedimentos-incorporados-ao-fluxo-da-equipe) |
| | 2.2 Registro e acompanhamento (classificação, responsáveis, prazos) | 🟡 | [2.2](#22-registro-e-acompanhamento-das-demandas) |
| | 2.3 Verificações e mecanismos automatizados | 🟡 | [2.3](#23-verificações-e-mecanismos-automatizados) |
| | 2.4 Demonstração com situação real | ✅ | [2.4](#24-demonstração-da-identificação-ao-encaminhamento) |
| **Entrega** | O que apresentar em aula | — | [3](#3-roteiro-da-apresentação) |

---

## 1. Definição da política de manutenção

> **Pedido:** elaborar, com base no Capítulo 13, uma política que contemple tratamento de falhas, critérios e prazos,
> gestão de instáveis, revisão periódica e remoção de testes, com decisões justificadas pelo contexto do projeto e
> registradas em `docs/tas.md`.

### Contexto que justifica as decisões

Todas as decisões abaixo partem destes fatos do projeto ([tas.md, seção 2](tas.md#2-contexto-que-orienta-as-decisões)):

| Fato do projeto | Consequência na política |
| --- | --- |
| Equipe de 7 pessoas, só 1 com Testes como área primária, reunião **semanal**, ninguém de plantão | Prazos e revisões cabem no ritmo semanal/mensal |
| A `main` é protegida pelo Quality Gate: teste vermelho na `main` bloqueia **todos** os PRs | Falha na `main` é a mais cara e tem o prazo mais curto |
| Tudo dentro do GitHub, sem ferramenta paga | Registro em issues, automação em Actions, sem Jira/Allure/SonarCloud |
| Dados de teste locais e determinísticos (SQLite + seed) | Instabilidade tende a vir do E2E; unitários e API não reexecutam |
| Público inclui gestores públicos | Na dúvida, a falha é tratada como defeito real, nunca silenciada |

### 1.1 Tratamento de falhas

> **Pedido:** procedimentos para investigar, classificar e encaminhar falhas relacionadas ao SUT, à TAS, ao ambiente
> ou a variações esperadas.

**O que definimos:** todo problema segue o mesmo fluxo — **detectar → registrar → investigar → classificar →
encaminhar → fechar** ([tas.md, 3.1](tas.md#31-tratamento-de-falhas)).

**Investigar** — roteiro fixo, nesta ordem:

1. JUnit e mensagem de erro (Job Summary e issue).
2. Diff entre a última execução verde e a vermelha.
3. Artefatos: logs do backend e do app web, trace e screenshot do Playwright, relatório HTML.
4. Reexecução local do teste isolado (`npx playwright test -g "TCxx"` ou `npm test -- -t "TCxx"`).

**Classificar e encaminhar** — quatro origens, cada uma com label, dono e destino:

| Origem | Como reconhecer | Encaminhamento | Responsável |
| --- | --- | --- | --- |
| **SUT** (`origem:sut`) | Comportamento contraria o caso de teste; reproduz manualmente | Vira `bug`; corrige app/API, o teste é a prova | Squad Mobile (`squad:mob`) |
| **TAS** (`origem:tas`) | Seletor quebrado, espera mal feita, dado de teste errado; app funciona manualmente | Corrige teste/helper/seed; se não couber no prazo, quarentena | Squad de Testes (`squad:test`) |
| **Ambiente** (`origem:ambiente`) | Runner sem rede, `npm ci` falhou, serviço externo fora, job que nem iniciou | Reexecuta uma vez; persistindo, ajusta workflow ou isola a dependência | Squad de Testes |
| **Variação esperada** (`origem:variacao-esperada`) | Comportamento mudou de propósito e o teste ficou desatualizado | Atualiza teste **e** caso de teste no mesmo PR da mudança | Autor da mudança |

**Decisões e justificativas:**

| Decisão | Justificativa |
| --- | --- |
| **Na dúvida entre SUT e TAS, é SUT** até alguém reproduzir o comportamento correto | Evita "consertar o teste" para aceitar um defeito; o custo de um defeito escondido (gestores públicos) é maior que um PR atrasado |
| **Ambiente só depois de descartar SUT e TAS**; reexecutar sem investigar é proibido | Reexecução só vale como diagnóstico, registrada na issue |
| **Variação esperada exige rastro** (issue/PR que mudou o comportamento) | Sem rastro, volta para SUT |
| **Pipeline que não executa também é falha** (Ambiente, P1), com contingência local + aprovação do PM | Aprendido na demonstração ([2.4, caso 1](#caso-1--regressão-da-main-não-executa-ambiente-p1)): quando o Actions está fora, nenhum alerta automático dispara |

### 1.2 Critérios e prazos de correção

> **Pedido:** definição de prioridades, responsabilidades e prazos para resolução dos problemas.

**Prioridades e prazos** ([tas.md, 3.2](tas.md#32-critérios-e-prazos-de-correção)):

| Prioridade | Critério | Triagem | Correção | Exemplo |
| --- | --- | --- | --- | --- |
| **P1** | Bloqueia a `main` ou quebra funcionalidade *Must have* | mesmo dia | **1 dia** | regressão diária vermelha |
| **P2** | Bloqueia PRs sem estar na `main`, ou falha em *Should/Could have* | 1 dia | **3 dias** | E2E smoke quebrado por mudança de ambiente |
| **P3** | Teste instável ou em quarentena | 1 dia | **7 dias** (quarentena máx. 14) | teste que só passa na reexecução |
| **P4** | Melhoria da TAS: lentidão, duplicação, rastreabilidade | revisão mensal | **30 dias** | teste sem `TCxx` |

**Responsabilidades:**

- **Triagem:** squad de Testes.
- **Correção:** dono da origem (tabela 1.1), atribuído como *assignee*. Sem assignee, a cobrança automática avisa e o
  PM atribui na reunião semanal.
- **Prazo vencido:** label `prazo-vencido` + menção ao responsável. Ele corrige, renegocia na issue com justificativa
  ou escala para o PM na reunião semanal.

**Decisões e justificativas:**

| Decisão | Justificativa |
| --- | --- |
| P1 = 1 dia | Com o Quality Gate, cada dia de `main` vermelha é um dia sem merge para a equipe inteira |
| P1 sem correção no prazo: **reverter o commit**, nunca desligar o teste | Mantém a `main` verde sem esconder a falha |
| P3 = 7 dias, P4 = 30 dias | P3 equivale a um ciclo da reunião semanal; P4 a um ciclo da revisão mensal |
| Dias corridos, a partir da abertura da issue | Dias úteis exigiriam calendário acadêmico; com reunião semanal, dias corridos são previsíveis para todos |

### 1.3 Gestão de testes instáveis

> **Pedido:** estratégias para identificar e tratar testes intermitentes sem mascarar defeitos reais.

**Definição:** teste que falha e passa sem mudança no código do sistema nem do teste
([tas.md, 3.3](tas.md#33-gestão-de-testes-instáveis-flaky)).

**Como identificamos:**

- No CI, o Playwright roda com `retries: 1` **só para diagnóstico**: o teste que passa na 2ª tentativa fica verde no
  gate, mas é marcado `flaky`, aparece no Job Summary e **abre automaticamente uma issue `flaky` P3** (uma por teste;
  nova ocorrência vira comentário). A 2ª tentativa grava trace como evidência.
- Localmente `retries` é 0, para quem desenvolve ver a falha.
- Unitários e API não reexecutam (são determinísticos); intermitência neles é registrada à mão pelo formulário.

**Como tratamos sem mascarar defeito:**

1. **Primeiro, verificar se é SUT** (condição de corrida no próprio app). Se for, vira `origem:sut` e o teste
   **continua no gate**.
2. **Se for TAS, corrigir a causa:** esperar por condição em vez de tempo fixo, isolar dados, remover dependência de
   ordem.
3. **Correções proibidas:** aumentar `retries`, `waitForTimeout`/`sleep`, aumentar timeout sem explicar a causa,
   apagar asserção.
4. **Quarentena**, só se a correção não couber no prazo P3:
   - título marcado com `@quarentena #NN` — sem issue, o check **falha o PR**;
   - sai do gate, mas **continua rodando** na regressão diária em passo separado que não bloqueia;
   - **máximo 14 dias**; depois, corrigir ou pedir remoção (1.5);
   - se cobre história *Must have*, o caso é executado **manualmente** a cada entrega.

**Justificativa:** sem reexecução não se distingue intermitência de falha real; mas reexecução que só deixa verde
mascara defeito. Por isso o retry existe para **gerar a issue**, não para esconder. A quarentena tira o ruído dos PRs
sem perder o sinal, porque o teste continua executando.

### 1.4 Revisão periódica

> **Pedido:** frequência e critérios para avaliar instabilidade, tempo de execução, duplicação de código e
> rastreabilidade dos testes.

**Frequência:** **mensal**, todo dia 1, com issue `revisao-periodica` aberta automaticamente (prazo de 7 dias),
conduzida pelo squad de Testes e fechada na reunião semanal seguinte ([tas.md, 3.4](tas.md#34-revisão-periódica)).

**Critérios:**

| Critério pedido | O que se avalia | Limite / gatilho | Fonte |
| --- | --- | --- | --- |
| **Instabilidade** | testes `flaky`, quarentenas abertas e sua idade | todo `flaky` com issue e responsável; quarentena > 14 dias | issues `flaky`/`quarentena`, `verificar.mjs` |
| **Tempo de execução** | duração por teste e tendência da suíte | unitário > 2 s, API > 5 s, E2E > 60 s; suíte crescendo 3 execuções seguidas | `verificar.mjs`, métricas M8/M9 |
| **Duplicação de código** | testes com mesmo nome, cenários no mesmo fluxo, helpers copiados | nome repetido; dois testes no mesmo TC sem motivo | `verificar.mjs` + leitura guiada por checklist |
| **Rastreabilidade** | todo teste cita o `TCxx` que automatiza | teste sem `TCxx` | `verificar.mjs`, métrica M4 |
| *Extra:* remoções | todo teste removido no mês tem pedido aprovado | remoção sem issue | check do PR |

Cada achado vira issue P4 (ou P3, se for instabilidade).

**Decisões e justificativas:**

| Decisão | Justificativa |
| --- | --- |
| Mensal, não semanal | Um ciclo de entrega da disciplina dura ~1 mês e ~100 testes não justificam mais; as verificações contínuas em cada PR cobrem o intervalo |
| Limites 2 s / 5 s / 60 s | Calibrados no que a suíte leva hoje: unitários em milissegundos, API em memória, E2E mais longo ~30 s (60 s dá folga) |
| Duplicação por leitura, sem detector de clones (jscpd) | Acrescentaria dependência para uma base de testes ainda pequena |

### 1.5 Remoção de testes

> **Pedido:** critérios para descontinuar testes, considerando justificativas, responsáveis pela decisão e riscos
> assumidos.

**Critérios — só se remove por um destes motivos** ([tas.md, 3.5](tas.md#35-remoção-de-testes)):

- funcionalidade removida ou fora do escopo;
- duplicado (outro teste cobre o mesmo caso no mesmo nível ou em nível mais barato);
- instável sem correção viável após o prazo de quarentena;
- custo de manutenção maior que o valor, em funcionalidade *Could have*;
- substituído por teste em outro nível (ex.: E2E trocado por API).

**Não são motivos:** "está falhando" (tratado em 1.1) e "está lento" (melhoria P4).

**Responsáveis pela decisão:** 1 membro do squad de Testes **+** dono da funcionalidade (squad Mobile; Segurança para
testes de segurança) **+ PM** se a história for *Must have*. A aprovação é a label `remocao-aprovada`.

**Justificativa e risco assumido:** o formulário **Remoção de teste** exige motivo, justificativa, **cobertura que
fica** (substituto ou execução manual) e **risco assumido** (o que pode passar sem ser detectado). O PR precisa citar
`Remove teste: #NN`, e o caso no checklist de implementação volta para manual ou aponta o substituto.

**Justificativa da regra:** remover teste é aceitar risco; a decisão precisa de quem conhece o risco (Testes) e de
quem responde pela funcionalidade (dono/PM).

### 1.6 Decisões justificadas e registradas na TAS

> **Pedido:** decisões justificadas pelo contexto do projeto e registradas em `docs/tas.md`.

Feito. [`docs/tas.md`](tas.md) está organizado assim:

| Seção do `tas.md` | Conteúdo |
| --- | --- |
| 1. A TAS em uma página | Camadas de teste, ferramentas e quando cada uma roda |
| 2. Contexto que orienta as decisões | Os fatos do projeto usados nas justificativas |
| 3.1 a 3.5 | Um subitem por item pedido, cada regra com o "porquê" ao lado |
| 4. Como a política é aplicada no GitHub | Regra → mecanismo → arquivo, e fluxograma do tratamento |

---

## 2. Implementação da política de manutenção

### 2.1 Procedimentos incorporados ao fluxo da equipe

> **Pedido:** incorporar os procedimentos ao fluxo de trabalho da equipe usando os recursos do GitHub.

Cada ponto do fluxo diário da equipe ganhou um recurso do GitHub que conduz à política:

| Momento do fluxo | Recurso | Arquivo |
| --- | --- | --- |
| Alguém encontra um problema | Formulário de issue **Manutenção de teste** | [`.github/ISSUE_TEMPLATE/manutencao-teste.yml`](../.github/ISSUE_TEMPLATE/manutencao-teste.yml) |
| Alguém quer remover um teste | Formulário de issue **Remoção de teste** | [`.github/ISSUE_TEMPLATE/remocao-teste.yml`](../.github/ISSUE_TEMPLATE/remocao-teste.yml) |
| Abertura de PR | Template de PR com checklist (rastreabilidade `TCxx`, sem `.only`/`skip` sem issue, linha `Remove teste: #NN`) | [`.github/pull_request_template.md`](../.github/pull_request_template.md) |
| Vocabulário comum | Labels da política (`manutencao`, `triagem`, `origem:*`, `prioridade:P1..P4`, `flaky`, `quarentena`, `prazo-vencido`, `remocao-teste`, `remocao-aprovada`, `revisao-periodica`) — já criadas no repositório | [`scripts/manutencao/labels.sh`](../scripts/manutencao/labels.sh) |
| Reunião semanal | Badges da regressão e da manutenção no README + link para a política | [`README.md`](../README.md) |

### 2.2 Registro e acompanhamento das demandas

> **Pedido:** mecanismos de registro e acompanhamento das demandas de manutenção, incluindo classificação,
> responsáveis e prazos.

| Exigência | Como atendemos | Onde |
| --- | --- | --- |
| **Registro** | Toda demanda é uma issue `manutencao`: pelo formulário (pessoas), ou aberta automaticamente (falha da regressão, teste `flaky`, revisão mensal) | formulários; `regressao.yml`; `manutencao.yml` |
| **Classificação** | Formulário tem campos obrigatórios de **origem** e **prioridade**; o job `classificar` lê o formulário e aplica `origem:*`, `prioridade:P*`, `flaky`/`quarentena` e tira `triagem` | [`manutencao.yml`](../.github/workflows/manutencao.yml), job `classificar` |
| **Responsáveis** | O mesmo job aplica o squad dono: `squad:mob` + `bug` para SUT; `squad:test` nos demais | job `classificar` |
| **Prazos** | Prazo calculado pela prioridade (1/3/7/30 dias); falha da regressão já nasce P1 com prazo de 1 dia | job `classificar`; `regressao.yml`, job Qualidade |
| **Acompanhamento** | Job `prazos` (dias úteis, 8h): prazo vencido recebe `prazo-vencido` + menção ao responsável; triagem parada > 1 dia recebe lembrete | job `prazos` |

**Status 🟡:** formulários e labels já estão ativos e foram usados nas issues 54 e 55. Os jobs `classificar` e `prazos`
passam a rodar após o merge do PR 56 e o desbloqueio do Actions (issue 54).

### 2.3 Verificações e mecanismos automatizados

> **Pedido:** implementar, quando aplicável, verificações ou mecanismos automatizados que apoiem a identificação de
> problemas e a aplicação da política.

| Mecanismo | O que faz | Regra da política que aplica | Onde |
| --- | --- | --- | --- |
| **Verificador da TAS** | **Erros** (falham o check): `.only`, `skip`/`fixme`/`@quarentena` sem issue. **Avisos**: instáveis, quarentenas, lentos, sem `TCxx`, nomes duplicados | 1.3 e 1.4 | [`scripts/manutencao/verificar.mjs`](../scripts/manutencao/verificar.mjs) |
| **Check `Verificação da TAS`** | Roda o verificador em todo PR e push na `main`; barra PR que apaga testes sem `Remove teste: #NN` aprovado | 1.3 e 1.5 | `manutencao.yml`, job `verificacao` |
| **Detecção de instáveis** | `retries: 1` no CI + reporter JSON + issue `flaky` P3 por teste, sem duplicar | 1.3 | [`e2e/playwright.config.ts`](../e2e/playwright.config.ts), [`regressao.yml`](../.github/workflows/regressao.yml) |
| **Quarentena** | `--grep-invert @quarentena` no gate; passo separado, não bloqueante, roda os testes em quarentena | 1.3 | `regressao.yml`, passo "Testes em quarentena" |
| **Issue de falha com prazo** | Falha na `main` abre issue `falha-pipeline` + `manutencao` + `triagem`, P1, prazo de 1 dia | 1.1 e 1.2 | `regressao.yml`, job Qualidade |
| **Revisão periódica** | Dia 1 (ou manual): baixa a última regressão diária, roda o verificador e abre "Revisão periódica da TAS — AAAA-MM" com contagens, tendência de tempo e checklist | 1.4 | `manutencao.yml`, job `revisao` |

**Status 🟡 e como foi validado:** o Actions da conta está bloqueado por cobrança (issue 54), então os workflows ainda
não rodaram no GitHub. Validação local:

- YAML dos dois workflows carregado sem erro; scripts bash checados com `bash -n`.
- Criação da issue `flaky` executada com `gh` e `jq` simulados: o corpo gerado tem os campos do formulário.
- Job `classificar` executado com mock da API: com origem TAS, P3, tipo instável e prazo vazio, aplicou `origem:tas`,
  `prioridade:P3` e `flaky`, tirou `triagem` e definiu prazo de 7 dias.
- Regra de remoção testada com diff simulado (3 declarações removidas e 1 adicionada exigem `Remove teste: #NN`).
- `verificar.mjs` testado em três casos: arquivo com `.skip` sem issue, `.only` e `@quarentena #47` (2 erros, 1
  quarentena listada, saída 1); JSON do Playwright com teste `flaky` (aviso); e resultados reais da regressão local
  (usados no caso 2 da demonstração).

### 2.4 Demonstração: da identificação ao encaminhamento

> **Pedido:** aplicar a política a pelo menos uma situação real ou simulada, da identificação do problema ao
> encaminhamento.

Foram dois casos **reais**, encontrados ao preparar a primeira revisão periódica.

#### Caso 1 — Regressão da `main` não executa (Ambiente, P1)

[Issue 54](https://github.com/mxs2/urbanize/issues/54) · labels `manutencao`, `origem:ambiente`, `prioridade:P1`, `squad:test`

| Etapa da política | O que aconteceu | Evidência |
| --- | --- | --- |
| **Identificação** | O verificador não achou artefatos da última regressão diária. A `main` estava com `failure` em todas as regressões diárias desde 2026-11-05 (11 seguidas); a última verde foi em 2026-11-03 | [execução de 15/11](https://github.com/mxs2/urbanize/actions/runs/43695411711) |
| **Investigação** | Jobs com 0 passos executados. Anotação: `The job was not started because your account is locked due to a billing issue.` Checks dos PRs falham pelo mesmo motivo | anotação do job; checks do PR 53 |
| **Descarte de SUT e TAS** (regra 1.1) | Contingência local: unitários, API e BDD rodaram 83 testes com 100% de aprovação; nenhum passo do workflow chegou a rodar | [resumo da regressão local](evidencias-manutencao/regressao-local-resumo.md) |
| **Registro** | Issue aberta pelo formulário **Manutenção de teste** | issue 54 |
| **Classificação** | Origem **Ambiente**; **P1** (Quality Gate sem checks válidos bloqueia merges); prazo 2026-11-16 | labels da issue |
| **Encaminhamento** | (1) Dono da conta regulariza a cobrança. (2) Até lá, contingência: testes locais anexados ao PR + merge com aprovação do PM. (3) Fecha quando a regressão diária voltar a passar | corpo e comentário da issue 54 |
| **Melhoria da política** | A falha ficou **silenciosa por 10 dias**, porque o job que abriria a issue também não roda. A política ganhou a regra "pipeline que não executa também é falha", a conferência do badge na reunião semanal e o procedimento de contingência | [tas.md, 3.1](tas.md#31-tratamento-de-falhas); badge no README |

#### Caso 2 — Rastreabilidade e duplicação (TAS, P4)

[Issue 55](https://github.com/mxs2/urbanize/issues/55) · labels `manutencao`, `origem:tas`, `prioridade:P4`, `squad:test`

| Etapa da política | O que aconteceu | Evidência |
| --- | --- | --- |
| **Identificação** | O verificador, rodado sobre a regressão local, apontou 25 testes de unitários e API sem `TCxx`; a listagem do Playwright mostrou mais 2 E2E. Na leitura, `triagem-gestor.spec.ts` repete o fluxo do TC81 | [diagnóstico](evidencias-manutencao/regressao-local-manutencao.md) |
| **Registro** | Issue aberta pelo formulário **Manutenção de teste** | issue 55 |
| **Classificação** | Origem **TAS** (problema na automação, não no sistema); **P4** (melhoria); prazo 2026-12-15 | labels da issue |
| **Encaminhamento** | Squad de Testes renomeia os testes com o `TCxx` ou cria o caso que falta. `triagem-gestor.spec.ts` vira caso próprio, se cobrir algo além do TC81, ou segue o fluxo de **Remoção de teste** (1.5). A próxima revisão confere que o aviso zerou | corpo da issue 55 |

**Observação:** as labels das duas issues foram aplicadas à mão, porque o job `classificar` só roda após o merge e com
o Actions desbloqueado. São as mesmas labels que o job aplicaria, conforme o teste com mock descrito em 2.3.

---

## 3. Roteiro da apresentação

Mapeia cada item da **Entrega** pedida ao que mostrar:

| A entrega pede | O que mostrar | Onde abrir |
| --- | --- | --- |
| **Política documentada, com decisões e justificativas** | Contexto do projeto e os 5 itens da política, cada um com as decisões e o porquê | Seção 1 deste documento; [`docs/tas.md`](tas.md), seções 2 e 3 |
| **Mecanismos no GitHub que operacionalizam a política** | Formulário de nova issue, labels, template de PR, workflows `manutencao.yml` e `regressao.yml`, `verificar.mjs` | Seções 2.1 a 2.3; aba *Issues → New issue*; PR 56 |
| **Demonstração prática: registro, classificação e encaminhamento** | Issue 54 (Ambiente, P1) passo a passo; issue 55 (TAS, P4) como segundo exemplo | Seção 2.4; issues 54 e 55 |

Sugestão de ordem: **contexto (1 min) → política item a item (1.1 a 1.5) → mecanismos (2.1 a 2.3) → demonstração com
a issue 54 aberta na tela (2.4) → pendências**.

## Pendências

1. Regularizar a cobrança do GitHub Actions da conta `mxs2` (issue 54); sem isso nenhum workflow roda.
2. Mergear o PR 56 e incluir o check `Verificação da TAS` no ruleset da `main`.
3. Depois do merge, rodar `Manutenção da TAS` manualmente (tarefa `revisao`) para abrir a primeira revisão periódica.
4. Executar o encaminhamento da issue 55.
