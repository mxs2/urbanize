# PLANO DE TESTES

## SQUAD

Hyngrid Souza

## INTRODUÇÃO

### Objeto de Teste

Urbanize — Plataforma de Gestão de Demandas Urbanas

### Descrição do Objeto de Teste

O Urbanize é uma aplicação web responsiva desenvolvida em Next.js, TypeScript, Chakra UI, Tailwind e Zustand, voltada para o registro, acompanhamento e gestão de demandas urbanas.

A solução atende dois perfis principais:

- **Cidadão:** registra demandas urbanas, acompanha status, consulta detalhes e visualiza resumo das solicitações.
- **Gestor:** acompanha métricas, consulta fila de demandas, revisa triagem inteligente e atualiza status/observações.

As funcionalidades principais incluem:

- Home com apresentação da proposta;
- Cadastro e login com backend real;
- Registro de nova demanda urbana com upload de foto;
- Listagem de demandas com filtros;
- Detalhe da demanda com descrição, localização, prioridade, status e histórico;
- Dashboard do cidadão;
- Painel do gestor com métricas, fila recente e triagem inteligente;
- Estados de carregamento, erro e lista vazia;
- Interface responsiva para desktop, tablet e mobile.

Nesta etapa, o sistema utiliza backend Express, Prisma/SQLite, autenticação JWT e upload local de imagens. MSW e rotas mock permanecem apenas como legado técnico da etapa inicial.

### Objetivo de Teste

O objetivo deste plano de testes é validar se o Urbanize atende aos requisitos definidos para o MVP, garantindo que os fluxos críticos funcionem corretamente e ofereçam uma experiência clara para cidadãos e gestores.

Os testes terão foco especial em:

- Autenticação real de cidadão e gestor;
- Cadastro de novo usuário;
- Registro de demandas urbanas;
- Listagem e filtragem de demandas;
- Consulta de detalhes, status e histórico;
- Dashboard do cidadão;
- Painel do gestor;
- Atualização de status e observações;
- Revisão de triagem inteligente baseada em imagem;
- Estados de loading, erro e vazio;
- Responsividade e acessibilidade básica.

## VERSÃO

### Versão do documento

1.0

### Data

22/05/2026

### Autor(es)

Hyngrid Souza

### Histórico de alterações

| Versão | Data | Alteração | Responsável |
| --- | --- | --- | --- |
| 1.0 | 22/05/2026 | Criação inicial do plano de testes do projeto Urbanize. | Hyngrid Souza |

## ESCOPO

### Incluído no escopo

- Login com backend real;
- Cadastro de usuário;
- Home e navegação principal;
- Registro de nova demanda;
- Validação dos campos obrigatórios da demanda;
- Listagem de demandas;
- Filtros por busca, status, categoria, bairro e prioridade;
- Visualização do detalhe da demanda;
- Exibição de protocolo, descrição, localização, status, prioridade e histórico;
- Dashboard do cidadão;
- Painel do gestor;
- Métricas do sistema;
- Fila de demandas recentes;
- Upload de foto e triagem inteligente;
- Aceite de sugestão de encaminhamento;
- Atualização de status e observação pelo gestor;
- Estados de loading, erro e vazio;
- Responsividade em mobile, tablet e desktop;
- Acessibilidade básica: labels, contraste e foco.

### Fora do escopo

- Integração oficial com órgãos públicos;
- Envio de notificações por e-mail, SMS ou push;
- Geolocalização avançada além de EXIF/browser;
- Testes de carga em ambiente produtivo;
- Testes de segurança avançados;
- Aplicativo mobile nativo;
- Implantação em produção.

## EQUIPE

| Nome | Papel | Responsabilidades |
| --- | --- | --- |
| Hyngrid Souza | Desenvolvedora / QA / Documentação | Planejar os testes, executar cenários manuais, validar os fluxos do frontend, registrar problemas encontrados e manter o plano de testes atualizado. |
| Usuário cidadão de teste | Usuário final | Validar se o fluxo de cadastro, login, criação e acompanhamento de demandas está compreensível. |
| Usuário gestor de teste | Usuário final / stakeholder | Validar se o painel do gestor, métricas, triagem e atualização de status atendem ao objetivo de gestão. |

## RISCOS E CONTINGÊNCIAS

| Risco | Impacto | Probabilidade | Estratégia de mitigação / Contingência |
| --- | --- | --- | --- |
| Banco local ou migrações fora de sincronia. | Alto | Média | Executar `npm run db:migrate`, `npm run db:seed` e validar `.env` do backend. |
| Dados de teste inconsistentes durante a execução. | Médio | Média | Reexecutar seed, limpar sessão/localStorage e usar usuários padronizados. |
| Diferenças de comportamento entre desktop e mobile. | Alto | Média | Executar testes em pelo menos três larguras: mobile, tablet e desktop. |
| Falta de tempo para testar todos os fluxos. | Alto | Média | Priorizar os fluxos Must have definidos na priorização de requisitos. |
| Alterações no código quebrarem fluxos já validados. | Alto | Média | Reexecutar testes críticos após mudanças nas telas de login, cadastro, demandas e painel gestor. |

## ESTRATÉGIA DE TESTES

### Tipos de Teste

Serão realizados testes funcionais e não funcionais.

Testes funcionais:

- Login;
- Cadastro;
- Registro de demanda;
- Listagem e filtros;
- Consulta de detalhe;
- Atualização de status;
- Upload de imagem e triagem inteligente;
- Dashboard e painel gestor.

Testes não funcionais:

- Usabilidade;
- Responsividade;
- Acessibilidade básica;
- Confiabilidade dos estados de loading, erro e vazio.

### Técnicas de Teste

Serão aplicadas técnicas de caixa-preta, considerando o comportamento esperado pelo usuário final.

- **Particionamento de equivalência:** separar entradas válidas e inválidas em formulários de login, cadastro e criação de demanda.
- **Análise de valor limite:** verificar campos obrigatórios vazios, preenchimento mínimo e prioridades selecionadas.
- **Tabela de decisão:** validar combinações de filtros, status, categoria, bairro e prioridade.
- **Teste de transição de estado:** verificar mudança de status da demanda, como registrada, em análise, encaminhada, em atendimento, resolvida e cancelada.
- **Teste exploratório:** navegar pelas rotas principais para identificar problemas de usabilidade, responsividade ou inconsistência visual.

Também poderão ser realizados testes de caixa-branca em pontos isolados, como funções utilitárias, stores, services e controllers.

### Níveis de Teste

- **Teste de componente/unidade:** validação de componentes, utilitários, stores e serviços isolados.
- **Teste de integração:** validação da comunicação entre páginas, stores, services, API Express e componentes.
- **Teste de sistema:** validação ponta a ponta dos fluxos principais do Urbanize.
- **Teste de aceite:** validação do comportamento esperado pelo cidadão e pelo gestor.

### Ferramentas e Ambientes

- Navegador web: Chrome, Safari ou equivalente;
- Ambiente local com Next.js;
- Node.js 20;
- Chakra UI, Tailwind e Zustand;
- Backend Express em `http://127.0.0.1:4000/api`;
- Banco SQLite local via Prisma;
- LocalStorage para persistência da sessão Zustand;
- DevTools do navegador para responsividade e inspeção;
- Execução local em `http://127.0.0.1:4100`;
- Possível uso futuro de Playwright ou Cypress para testes automatizados.

### Critérios de Aceitação

- O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas.
- O login deve permitir entrada com perfis de cidadão e gestor.
- O cadastro deve aceitar dados válidos, perfil e criar usuário no backend.
- O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados.
- Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe.
- A listagem deve exibir demandas e aplicar filtros corretamente.
- A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico.
- O dashboard do cidadão deve apresentar resumo das solicitações.
- O painel do gestor deve apresentar métricas, fila recente e triagem inteligente.
- O gestor deve conseguir atualizar status e observação da demanda.
- O sistema deve exibir estados adequados de carregamento, erro e vazio.
- A interface deve ser utilizável em mobile, tablet e desktop.
- Nenhum defeito crítico deve permanecer aberto antes da entrega.

## CENÁRIOS DE TESTE

| ID | Cenário de Teste |
| --- | --- |
| TS01 | Verificar login com perfil de cidadão. |
| TS02 | Verificar login com perfil de gestor. |
| TS03 | Verificar cadastro de novo usuário. |
| TS04 | Verificar criação de nova demanda urbana. |
| TS05 | Verificar validação de campos obrigatórios na criação de demanda. |
| TS06 | Verificar listagem e filtros de demandas. |
| TS07 | Verificar consulta do detalhe da demanda. |
| TS08 | Verificar dashboard do cidadão. |
| TS09 | Verificar painel do gestor com métricas e fila recente. |
| TS10 | Verificar revisão e aceite da triagem inteligente. |
| TS11 | Verificar atualização de status e observação pelo gestor. |
| TS12 | Verificar responsividade e acessibilidade básica. |

## CASOS DE TESTE

### Caso de Teste 1

| Campo | Informação |
| --- | --- |
| ID | TC01 |
| Cenário de Teste | TS01 |
| Título | Login com perfil de cidadão |
| Pré-condições | Aplicação em execução. Usuário seed `cidadao@urbanize.com` disponível. |
| Passos | 1. Acessar `/login`.<br>2. Informar `cidadao@urbanize.com` e senha `demo`.<br>3. Acionar a entrada no sistema.<br>4. Verificar redirecionamento para área do cidadão. |
| Resultado Esperado | O sistema autentica o cidadão e permite acesso às funcionalidades do perfil cidadão. |

### Caso de Teste 2

| Campo | Informação |
| --- | --- |
| ID | TC02 |
| Cenário de Teste | TS02 |
| Título | Login com perfil de gestor |
| Pré-condições | Aplicação em execução. Usuário seed `gestor@urbanize.com` disponível. |
| Passos | 1. Acessar `/login`.<br>2. Informar `gestor@urbanize.com` e senha `demo`.<br>3. Acionar a entrada no sistema.<br>4. Acessar `/gestor`. |
| Resultado Esperado | O sistema autentica o gestor e permite acesso ao painel do gestor. |

### Caso de Teste 3

| Campo | Informação |
| --- | --- |
| ID | TC03 |
| Cenário de Teste | TS03 |
| Título | Cadastro de novo usuário |
| Pré-condições | Aplicação em execução e tela de cadastro disponível. |
| Passos | 1. Acessar `/cadastro`.<br>2. Informar nome, e-mail, senha e perfil.<br>3. Enviar o formulário. |
| Resultado Esperado | O sistema cria usuário no backend, gera sessão e permite acesso ao sistema. |

### Caso de Teste 4

| Campo | Informação |
| --- | --- |
| ID | TC04 |
| Cenário de Teste | TS04 |
| Título | Criação de nova demanda urbana |
| Pré-condições | Usuário cidadão autenticado. |
| Passos | 1. Acessar `/demandas/nova`.<br>2. Anexar uma foto do problema.<br>3. Conferir preenchimento automático de título e descrição.<br>4. Informar prioridade, endereço, bairro e cidade.<br>5. Marcar o aceite de compartilhamento de dados.<br>6. Enviar a demanda. |
| Resultado Esperado | O sistema registra a demanda, gera protocolo, salva imagem, define status em análise e redireciona para a página de detalhe. |

### Caso de Teste 5

| Campo | Informação |
| --- | --- |
| ID | TC05 |
| Cenário de Teste | TS05 |
| Título | Validação de campos obrigatórios na nova demanda |
| Pré-condições | Tela `/demandas/nova` aberta. |
| Passos | 1. Deixar campos obrigatórios em branco.<br>2. Tentar enviar a demanda.<br>3. Repetir sem marcar o aceite de compartilhamento. |
| Resultado Esperado | O sistema impede o envio e exibe aviso solicitando preenchimento dos campos obrigatórios ou confirmação do aceite. |

### Caso de Teste 6

| Campo | Informação |
| --- | --- |
| ID | TC06 |
| Cenário de Teste | TS06 |
| Título | Listagem e filtros de demandas |
| Pré-condições | Existirem demandas seed ou cadastradas. |
| Passos | 1. Acessar `/demandas`.<br>2. Aplicar filtros por status, categoria, prioridade, bairro ou busca.<br>3. Limpar filtros e observar a lista completa. |
| Resultado Esperado | A lista deve exibir apenas demandas compatíveis com os filtros aplicados e voltar ao estado completo ao limpar filtros. |

### Caso de Teste 7

| Campo | Informação |
| --- | --- |
| ID | TC07 |
| Cenário de Teste | TS07 |
| Título | Consulta do detalhe da demanda |
| Pré-condições | Existir ao menos uma demanda cadastrada. |
| Passos | 1. Acessar uma demanda pela listagem.<br>2. Verificar protocolo, título, data, status e prioridade.<br>3. Conferir descrição, localização e histórico. |
| Resultado Esperado | A tela de detalhe apresenta todas as informações da demanda de forma consistente e rastreável. |

### Caso de Teste 8

| Campo | Informação |
| --- | --- |
| ID | TC08 |
| Cenário de Teste | TS08 |
| Título | Dashboard do cidadão |
| Pré-condições | Existirem demandas cadastradas ou seed. |
| Passos | 1. Acessar `/dashboard`.<br>2. Verificar total de demandas, demandas em atendimento, resolvidas e tempo médio.<br>3. Conferir lista de últimas demandas. |
| Resultado Esperado | O dashboard apresenta resumo coerente das solicitações e permite acesso rápido às demandas recentes. |

### Caso de Teste 9

| Campo | Informação |
| --- | --- |
| ID | TC09 |
| Cenário de Teste | TS09 |
| Título | Painel do gestor |
| Pré-condições | Login com perfil de gestor. |
| Passos | 1. Acessar `/gestor`.<br>2. Verificar métricas principais.<br>3. Filtrar fila por status.<br>4. Conferir demandas exibidas na fila recente. |
| Resultado Esperado | O painel apresenta métricas, fila recente e filtros úteis para acompanhamento das demandas. |

### Caso de Teste 10

| Campo | Informação |
| --- | --- |
| ID | TC10 |
| Cenário de Teste | TS10 |
| Título | Revisão e aceite da triagem inteligente |
| Pré-condições | Existir demanda com status `em_analise` e sugestão de encaminhamento. |
| Passos | 1. Acessar `/gestor`.<br>2. Localizar a seção de triagem inteligente.<br>3. Conferir foto, descrição, sugestão de órgão e confiança.<br>4. Clicar em aceitar sugestão. |
| Resultado Esperado | A demanda é encaminhada, o status é atualizado e a ação fica refletida no histórico/estado da demanda. |

### Caso de Teste 11

| Campo | Informação |
| --- | --- |
| ID | TC11 |
| Cenário de Teste | TS11 |
| Título | Atualização de status e observação pelo gestor |
| Pré-condições | Existir demanda aberta em página de detalhe. |
| Passos | 1. Acessar detalhe da demanda.<br>2. Inserir observação do gestor.<br>3. Acionar encaminhamento/atualização.<br>4. Verificar histórico. |
| Resultado Esperado | O sistema atualiza o status da demanda, registra observação e adiciona evento ao histórico. |

### Caso de Teste 12

| Campo | Informação |
| --- | --- |
| ID | TC12 |
| Cenário de Teste | TS12 |
| Título | Responsividade e acessibilidade básica |
| Pré-condições | Aplicação em execução no navegador. |
| Passos | 1. Abrir home, login, demandas, detalhe, dashboard e gestor em larguras mobile, tablet e desktop.<br>2. Verificar leitura dos textos, foco em campos, labels e contraste.<br>3. Conferir se botões e formulários permanecem utilizáveis. |
| Resultado Esperado | A interface permanece legível, navegável e utilizável nos principais tamanhos de tela, sem sobreposição grave de elementos. |

## ATIVIDADES E ESTIMATIVAS

| Atividade | Descrição | Responsável | Prazo Estimado |
| --- | --- | --- | --- |
| Preparar ambiente de testes | Instalar dependências, configurar `.env`, aplicar migrations, executar seed e limpar sessão/localStorage quando necessário. | Hyngrid Souza | 30 min |
| Validar autenticação e cadastro | Executar testes de login cidadão, login gestor e cadastro. | Hyngrid Souza | 40 min |
| Validar fluxo de demandas | Testar criação, validação de campos, listagem, filtros e detalhe. | Hyngrid Souza | 1h30 |
| Validar dashboards e painel gestor | Testar dashboard cidadão, métricas, fila recente, triagem e atualização de status. | Hyngrid Souza | 1h |
| Validar responsividade | Testar telas principais em mobile, tablet e desktop. | Hyngrid Souza | 1h |
| Registrar evidências e defeitos | Anotar resultados, inconsistências encontradas e possíveis melhorias. | Hyngrid Souza | 40 min |
| Revisar plano de testes | Ajustar cenários, casos e critérios conforme evolução do projeto. | Hyngrid Souza | 30 min |
