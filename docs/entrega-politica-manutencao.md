# Entrega — Política de Manutenção

Registra o que a equipe fez em cada item da atividade, onde está no repositório e as evidências. A política em si está
em [`docs/tas.md`](tas.md); este documento é o guia da entrega.

**Legenda:** ✅ completo · 🟡 implementado, aguardando condição externa

## Resumo

| # | Item pedido | Status | Onde |
| --- | --- | --- | --- |
| 1.1 | Tratamento de falhas (SUT, TAS, ambiente, variação esperada) | ✅ | [tas.md, 3.1](tas.md#31-tratamento-de-falhas) |
| 1.2 | Critérios e prazos de correção | ✅ | [tas.md, 3.2](tas.md#32-critérios-e-prazos-de-correção) |
| 1.3 | Gestão de testes instáveis | ✅ | [tas.md, 3.3](tas.md#33-gestão-de-testes-instáveis-flaky) |
| 1.4 | Revisão periódica | ✅ | [tas.md, 3.4](tas.md#34-revisão-periódica) |
| 1.5 | Remoção de testes | ✅ | [tas.md, 3.5](tas.md#35-remoção-de-testes) |
| 1.6 | Decisões justificadas e registradas em `docs/tas.md` | ✅ | [tas.md, 2 e 3](tas.md#2-contexto-que-orienta-as-decisões) |
| 2.1 | Procedimentos incorporados ao fluxo da equipe no GitHub | ✅ | formulários, template de PR, labels, README |
| 2.2 | Registro e acompanhamento (classificação, responsáveis, prazos) | 🟡 | formulários + labels ativos; automação de classificação e prazos entra com o merge do PR 56 |
| 2.3 | Verificações e mecanismos automatizados | 🟡 | `verificar.mjs` roda local; nos workflows depende do Actions, bloqueado por cobrança (issue 54) |
| 2.4 | Demonstração com situação real | ✅ | [issue 54](https://github.com/mxs2/urbanize/issues/54) e [issue 55](https://github.com/mxs2/urbanize/issues/55) |

PR da entrega: [mxs2/urbanize#56](https://github.com/mxs2/urbanize/pull/56).

## 1. Política de manutenção

A política está em [`docs/tas.md`](tas.md), seção 3, precedida pelo contexto que justifica as decisões (seção 2). As
decisões principais:

| Tema | Decisão | Justificativa (contexto do projeto) |
| --- | --- | --- |
| Classificação | Quatro origens com sinais típicos, responsável e encaminhamento definidos | Cada origem tem um dono diferente: app/API é do squad Mobile, testes e workflow são do squad de Testes |
| Dúvida SUT × TAS | Trata como **SUT** até reproduzir manualmente o comportamento correto | O público inclui gestores públicos; "consertar o teste" para aceitar um defeito custa mais que um PR atrasado |
| Prioridades | P1 a P4 com prazo de 1, 3, 7 e 30 dias corridos | Com o Quality Gate, `main` vermelha bloqueia todo mundo (P1 curto). P3 equivale a um ciclo da reunião semanal e P4 ao ciclo da revisão mensal |
| P1 sem correção no prazo | **Reverter o commit**, nunca desligar o teste | Mantém a `main` verde sem esconder a falha |
| Instáveis | `retries: 1` só no CI e **só para diagnóstico**: o teste fica verde, mas abre issue `flaky` | Sem reexecução não se distingue intermitência de falha real (era o motivo da métrica ter sido descartada) |
| Correções proibidas | Aumentar retries, `waitForTimeout`, timeout sem causa, apagar asserção | São as formas mais comuns de mascarar defeito |
| Quarentena | `@quarentena #NN`, máx. 14 dias, sai do gate mas **continua rodando** na diária; teste Must have em quarentena é executado manualmente | Tira o ruído dos PRs sem perder o sinal |
| Revisão | Mensal, com issue automática e checklist (instabilidade, tempo, duplicação, rastreabilidade, remoções) | Ciclo de entrega da disciplina ≈ 1 mês; ~100 testes não justificam revisão semanal |
| Limites de tempo | unitário 2 s, API 5 s, E2E 60 s por teste | Calibrados no que a suíte leva hoje, com folga |
| Remoção | Só por motivos listados; aprovação de Testes + dono da funcionalidade (+ PM se Must have); risco assumido registrado | Remover teste é aceitar risco; a decisão precisa de quem conhece o risco e de quem responde pela funcionalidade |
| Pipeline que não executa | É falha de Ambiente P1; contingência local + aprovação do PM | Lição da demonstração (seção 3): nada automático dispara quando o Actions está fora |

## 2. Mecanismos no repositório

| Mecanismo | Arquivo | O que faz |
| --- | --- | --- |
| Formulário **Manutenção de teste** | [`.github/ISSUE_TEMPLATE/manutencao-teste.yml`](../.github/ISSUE_TEMPLATE/manutencao-teste.yml) | Registra tipo, testes, evidência, **origem**, **prioridade**, **prazo** e encaminhamento; já nasce com `manutencao` + `triagem` |
| Formulário **Remoção de teste** | [`.github/ISSUE_TEMPLATE/remocao-teste.yml`](../.github/ISSUE_TEMPLATE/remocao-teste.yml) | Exige motivo, justificativa, cobertura que fica e risco assumido |
| Labels da política | [`scripts/manutencao/labels.sh`](../scripts/manutencao/labels.sh) | `manutencao`, `triagem`, `origem:*`, `prioridade:P1..P4`, `flaky`, `quarentena`, `prazo-vencido`, `remocao-teste`, `remocao-aprovada`, `revisao-periodica` (já criadas no repositório) |
| Template de PR | [`.github/pull_request_template.md`](../.github/pull_request_template.md) | Checklist de rastreabilidade, `.only`/`skip` e linha `Remove teste: #NN` |
| Verificador | [`scripts/manutencao/verificar.mjs`](../scripts/manutencao/verificar.mjs) | **Erros** (falham o check): `.only`, `skip`/`fixme`/`@quarentena` sem issue. **Avisos**: instáveis, quarentena (passando ou falhando), lentos, sem `TCxx`, nomes duplicados |
| Detecção de instáveis | [`e2e/playwright.config.ts`](../e2e/playwright.config.ts) + [`regressao.yml`](../.github/workflows/regressao.yml) | `retries: 1` no CI, reporter JSON e issue `flaky` P3 por teste, sem duplicar |
| Quarentena | `regressao.yml`, passo "Testes em quarentena" | `--grep-invert @quarentena` no gate; passo separado e não bloqueante roda os testes em quarentena |
| Issue de falha com prazo | `regressao.yml`, job Qualidade | A issue `falha-pipeline` passa a nascer com `manutencao`, `triagem`, P1 e prazo de 1 dia |
| Check `Verificação da TAS` | [`manutencao.yml`](../.github/workflows/manutencao.yml), job `verificacao` | Roda o verificador em todo PR e push na `main`. Barra PR que apaga testes sem `Remove teste: #NN` com `remocao-aprovada` |
| Classificação automática | `manutencao.yml`, job `classificar` | Lê o formulário e aplica `origem:*`, `prioridade:P*` e o squad responsável (`squad:mob` + `bug` para SUT; `squad:test` nos demais). Também aplica `flaky`/`quarentena`, tira `triagem` e preenche o prazo pela prioridade |
| Cobrança de prazos | `manutencao.yml`, job `prazos` (dias úteis, 8h) | Prazo vencido recebe `prazo-vencido` e menção ao responsável; triagem parada há mais de 1 dia recebe lembrete |
| Revisão periódica | `manutencao.yml`, job `revisao` (dia 1, ou manual) | Baixa a última regressão diária e roda o verificador. Abre a issue "Revisão periódica da TAS — AAAA-MM" com contagem das demandas, tendência de tempo e checklist |
| Visibilidade | [`README.md`](../README.md) | Badges da regressão e da manutenção; link para a política |

### Como foi validado

O Actions da conta está bloqueado (seção 3), então os workflows ainda não rodaram no GitHub. Validação local:

- YAML dos dois workflows carregado sem erro e scripts bash checados com `bash -n`.
- Script de criação da issue `flaky` executado com `gh` e `jq` simulados; o corpo gerado tem os campos do formulário.
- Script do job `classificar` executado com mock da API do GitHub. Com origem TAS, P3, tipo instável e prazo vazio,
  aplicou `origem:tas`, `prioridade:P3` e `flaky`, tirou `triagem` e definiu o prazo para 7 dias.
- Regra de remoção testada com diff simulado (3 declarações removidas e 1 adicionada exigem `Remove teste: #NN`).
- `verificar.mjs` testado em três casos:
  - arquivo com `.skip` sem issue, `.only` e `@quarentena #47`: dois erros, uma quarentena listada e saída 1;
  - JSON do Playwright com teste `flaky`: aviso e item em `instaveis`;
  - resultados reais da regressão local (abaixo).

## 3. Demonstração: da identificação ao encaminhamento

### Caso 1 — Regressão da `main` não executa: [issue 54](https://github.com/mxs2/urbanize/issues/54) (Ambiente, P1)

| Etapa | O que aconteceu | Evidência |
| --- | --- | --- |
| **Identificação** | Ao preparar a revisão periódica, o verificador não achou artefatos da última regressão diária. Na lista de execuções, a `main` aparece com `failure` em todas as regressões diárias desde 2026-11-05 (11 seguidas). A última verde foi em 2026-11-03 | [execução de 15/11](https://github.com/mxs2/urbanize/actions/runs/43695411711) |
| **Investigação** | Os jobs tinham 0 passos executados. A anotação do job diz `The job was not started because your account is locked due to a billing issue.` Os checks dos PRs abertos falham pelo mesmo motivo | anotação do job; checks do PR 53 |
| **Descarte de SUT e TAS** | Contingência local: unitários, API e BDD rodaram com 83 testes e 100% de aprovação. Nenhum passo do workflow chegou a rodar, então a automação não é a causa | [resumo da regressão local](evidencias-manutencao/regressao-local-resumo.md) |
| **Registro** | Issue aberta pelo formulário **Manutenção de teste** | [issue 54](https://github.com/mxs2/urbanize/issues/54) |
| **Classificação** | Origem **Ambiente**; prioridade **P1** (Quality Gate sem checks válidos bloqueia os merges); prazo 2026-11-16 | labels `manutencao`, `origem:ambiente`, `prioridade:P1`, `squad:test` |
| **Encaminhamento** | (1) O dono da conta regulariza a cobrança, único que pode resolver. (2) Até lá, vale a contingência: testes locais anexados ao PR e merge com aprovação do PM. (3) Fechamento automático quando a regressão diária voltar a passar | corpo e comentário da issue 54 |
| **Melhoria da política** | A falha ficou **silenciosa por 10 dias**: o job que abriria a issue também não roda. A política ganhou a regra "pipeline que não executa também é falha", a conferência do badge na reunião semanal e o procedimento de contingência | [tas.md, 3.1](tas.md#31-tratamento-de-falhas), badge no README |

### Caso 2 — Rastreabilidade e duplicação: [issue 55](https://github.com/mxs2/urbanize/issues/55) (TAS, P4)

| Etapa | O que aconteceu | Evidência |
| --- | --- | --- |
| **Identificação** | O verificador, rodado sobre a regressão local, apontou 25 testes de unitários e API sem `TCxx` no nome. A listagem do Playwright mostrou mais 2 E2E sem `TCxx`. Na leitura, `triagem-gestor.spec.ts` repete o fluxo do TC81 | [diagnóstico](evidencias-manutencao/regressao-local-manutencao.md) |
| **Registro e classificação** | Origem **TAS** (o problema está na automação, não no sistema); prioridade **P4** (melhoria); prazo 2026-12-15 | labels `origem:tas`, `prioridade:P4`, `squad:test` |
| **Encaminhamento** | O squad de Testes renomeia os testes com o `TCxx`, ou cria o caso que falta. Para `triagem-gestor.spec.ts`: vira caso próprio, se cobre algo além do TC81, ou segue o fluxo de **Remoção de teste**. A próxima revisão confere que o aviso zerou | corpo da issue 55 |

As labels das duas issues foram aplicadas à mão: o job `classificar` só vale depois do merge na `main` e com o Actions
desbloqueado. As labels são as mesmas que o job aplicaria, conforme o teste com mock descrito na seção 2.

## Pendências

1. Regularizar a cobrança do GitHub Actions da conta `mxs2` (issue 54); sem isso nenhum workflow roda.
2. Mergear o PR 56 e incluir o check `Verificação da TAS` no ruleset da `main`.
3. Depois do merge, rodar `Manutenção da TAS` manualmente (tarefa `revisao`) para abrir a primeira revisão periódica.
4. Executar o encaminhamento da issue 55.
