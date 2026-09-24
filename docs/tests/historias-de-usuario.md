# Histórias de Usuário — Urbanize

Complementa o [plano de testes](plano-de-testes.md). Os casos que verificam cada história estão em
[casos-de-teste.md](casos-de-teste.md).

**Origem:** histórias do backlog priorizado por MoSCoW ([docs/old/priorizacao-requisitos.md](../old/priorizacao-requisitos.md)).
Critérios de aceite da seção "Critérios de Aceitação" do plano de testes original
([docs/old/plano-de-testes.md](../old/plano-de-testes.md)). Os IDs `HU-xx` e `CA-xx` foram atribuídos na ordem dos documentos de origem.

## Histórias de usuário

| ID | História de usuário | Prioridade | Escopo de teste |
| --- | --- | --- | --- |
| HU-01 | Como cidadão, quero cadastrar minha conta no Urbanize para acessar o sistema e registrar demandas urbanas com meu perfil de usuário. | Must have | Dentro |
| HU-02 | Como cidadão ou gestor, quero fazer login na plataforma para acessar as funcionalidades correspondentes ao meu perfil. | Must have | Dentro |
| HU-03 | Como cidadão, quero registrar uma nova demanda informando foto, título, descrição, prioridade e localização para comunicar problemas urbanos à gestão pública de forma organizada. | Must have | Dentro |
| HU-04 | Como cidadão, quero acompanhar o status e o histórico de uma demanda para saber como minha solicitação está evoluindo. | Must have | Dentro |
| HU-05 | Como gestor, quero atualizar o status e registrar observações na demanda para manter o histórico do atendimento rastreável. | Must have | Dentro |
| HU-06 | Como cidadão ou gestor, quero visualizar e filtrar demandas cadastradas para encontrar rapidamente solicitações específicas. | Should have | Dentro |
| HU-07 | Como gestor, quero acessar um painel com métricas e fila recente para monitorar e priorizar demandas urbanas. | Should have | Dentro |
| HU-08 | Como gestor, quero revisar a triagem automática para validar categoria, confiança e sugestão de encaminhamento. | Should have | Dentro |
| HU-09 | Como gestor, quero aceitar a sugestão de encaminhamento para direcionar a demanda ao órgão adequado. | Should have | Dentro, sem caso: não há endpoint que registre o aceite |
| HU-10 | Como cidadão, quero consultar um dashboard resumido para acompanhar indicadores das minhas solicitações. | Could have | Dentro |
| HU-11 | Como cidadão, quero receber notificações por e-mail ou SMS sempre que o status da minha demanda for atualizado para me manter informado sem precisar acessar o sistema. | Won't have | Fora: não implementado |
| HU-12 | Como cidadão, quero anexar fotos ao registrar uma demanda para evidenciar visualmente o problema urbano relatado. | Should have | Dentro |
| HU-13 | Como cidadão, quero visualizar a localização da minha demanda em um mapa interativo para identificar geograficamente onde o problema está ocorrendo. | Won't have | Fora: não implementado |

## Critérios de aceite

| ID | Critério de aceite | Histórias vinculadas |
| --- | --- | --- |
| CA-01 | O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas. | HU-01, HU-02, HU-06 |
| CA-02 | O login deve permitir entrada com perfis de cidadão e gestor. | HU-02 |
| CA-03 | O cadastro deve aceitar dados válidos, perfil e criar usuário no backend. | HU-01 |
| CA-04 | O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados. | HU-03, HU-12 |
| CA-05 | Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe. | HU-03 |
| CA-06 | A listagem deve exibir demandas e aplicar filtros corretamente. | HU-06 |
| CA-07 | A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico. | HU-04 |
| CA-08 | O dashboard do cidadão deve apresentar resumo das solicitações. | HU-10 |
| CA-09 | O painel do gestor deve apresentar métricas, fila recente e triagem inteligente. | HU-07, HU-08 |
| CA-10 | O gestor deve conseguir atualizar status e observação da demanda. | HU-04, HU-05 |
| CA-11 | O sistema deve exibir estados adequados de carregamento, erro e vazio. | HU-06 |
| CA-12 | A interface deve ser utilizável em mobile, tablet e desktop. | HU-03 |
| CA-13 | Nenhum defeito crítico deve permanecer aberto antes da entrega. | Nenhuma: critério de saída do processo, não gera caso |

Os critérios de aceite de origem não apontam para uma história específica. O vínculo acima foi feito na
derivação dos casos de teste (ver [ia/saida-rodada-2.md](ia/saida-rodada-2.md)).

## Lacunas conhecidas

As histórias e critérios deixam regras sem valor definido. As 31 lacunas levantadas (L01 a L31) estão na
seção 1 de [ia/saida-rodada-2.md](ia/saida-rodada-2.md). As que bloqueiam casos:

| Lacuna | Afeta | Decisão pendente |
| --- | --- | --- |
| L05 | HU-05 | Quais transições de status são permitidas (ex.: `resolvida` pode voltar para `em_analise`?) |
| L09 | HU-06 | Como o gestor é vinculado a um órgão |
| L10 | HU-01 | Cadastro público aceita perfil `gestor`: risco de escalada de privilégio |
| L12 | HU-09 | Não há endpoint para aceitar a sugestão de encaminhamento |
