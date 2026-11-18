#!/usr/bin/env bash
# Cria/atualiza as labels da política de manutenção (docs/tas.md, seção 4). Idempotente.
# Uso: GH_REPO=mxs2/urbanize bash scripts/manutencao/labels.sh
set -euo pipefail
label() { gh label create "$1" --color "$2" --description "$3" --force; }
label manutencao               0E8A16 "Demanda de manutenção da automação de testes (TAS)"
label triagem                  FBCA04 "Aguardando investigação e classificação da origem"
label "origem:sut"             B60205 "Falha causada por defeito no sistema sob teste"
label "origem:tas"             1D76DB "Falha causada pela automação (teste, dados de teste, script)"
label "origem:ambiente"        5319E7 "Falha de infraestrutura, runner, rede ou serviço externo"
label "origem:variacao-esperada" C2E0C6 "Mudança intencional de comportamento; o teste precisa acompanhar"
label "prioridade:P1"          B60205 "Bloqueia a main ou funcionalidade Must have — 1 dia"
label "prioridade:P2"          D93F0B "Bloqueia PRs ou funcionalidade Should have — 3 dias"
label "prioridade:P3"          FBCA04 "Teste instável ou em quarentena — 7 dias"
label "prioridade:P4"          C5DEF5 "Melhoria da TAS — 30 dias"
label flaky                    F9D0C4 "Teste instável: falha e passa sem mudança de código"
label quarentena               D4C5F9 "Teste fora do gate até a correção (máx. 14 dias)"
label prazo-vencido            000000 "Prazo da política de manutenção estourado"
label remocao-teste            BFD4F2 "Pedido de remoção de teste automatizado"
label remocao-aprovada         0E8A16 "Remoção aprovada por Testes e pelo dono da funcionalidade"
label revisao-periodica        006B75 "Revisão mensal da TAS"
