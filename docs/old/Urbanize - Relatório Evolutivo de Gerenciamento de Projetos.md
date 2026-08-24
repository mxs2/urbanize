# TEMPLATE DE RELATÓRIO EVOLUTIVO DE GERENCIAMENTO DE PROJETOS

**Disciplina:** Projetos  
**Nome da Equipe:** Squad Urbanize  
**Nome do Projeto:** Urbanize - Plataforma de Gestão de Demandas Urbanas  
**Professor(a):** André Silva  
**Curso/Turma:** ADS - Embarque  
**Período de Desenvolvimento:** 11/05/26 a 19/06/26.

---

## 1. Identificação da Equipe

| Nome do integrante | Função no projeto | Responsabilidades principais |
| --- | --- | --- |
| Hyngrid | Desenvolvimento frontend | Implementação das telas em Next.js, componentes de interface, fluxo do cidadão, painel do gestor, upload de imagem, ajustes de usabilidade, responsividade e validações visuais. |
| Diego | Desenvolvimento backend | Implementação da API Express, autenticação, persistência com Prisma/SQLite, upload de imagens, endpoints de demandas, métricas, triagem e regras de autorização por perfil. |
| Pamela | Documentação e gestão do projeto | Organização do backlog, acompanhamento do cronograma, documentação de requisitos, jornadas, modelagem, plano de testes e consolidação do relatório evolutivo. |

---

## 2. Apresentação do Projeto

### 2.1 Título do Projeto

Urbanize - Plataforma de Gestão de Demandas Urbanas

### 2.2 Problema ou Necessidade Identificada

A gestão de demandas urbanas costuma ser fragmentada, com registros feitos por canais diferentes, baixa transparência para o cidadão e dificuldade de acompanhamento por parte dos gestores públicos. Problemas como buracos em vias, acúmulo de lixo e postes ou fiações caídas exigem encaminhamento rápido ao órgão responsável, mas muitas vezes chegam sem padronização, sem imagem de apoio e sem uma triagem inicial que ajude a priorizar o atendimento.

Essa falta de centralização aumenta o tempo de resposta, dificulta a análise de prioridades e prejudica a confiança do cidadão no processo. O Urbanize surge como uma solução web para registrar, classificar, acompanhar e gerenciar demandas urbanas com mais organização, rastreabilidade e apoio inteligente à triagem.

### 2.3 Público-Alvo

O público-alvo principal é formado por cidadãos que desejam registrar problemas urbanos de forma simples e acompanhar o andamento das solicitações. O sistema também atende gestores públicos responsáveis pela análise, triagem, encaminhamento e atualização do status das demandas.

Como público secundário, a solução pode apoiar órgãos municipais ou concessionárias envolvidas na execução dos serviços, como manutenção urbana, limpeza urbana e empresas responsáveis por energia e iluminação.

### 2.4 Objetivo Geral do Projeto

Desenvolver uma plataforma web para registrar, classificar por imagem, encaminhar e acompanhar demandas urbanas, oferecendo transparência ao cidadão e apoio operacional ao gestor público na triagem e atualização dos atendimentos.

### 2.5 Objetivos Específicos

| Nº | Objetivo específico |
| --- | --- |
| 1 | Permitir cadastro e login de cidadãos e gestores com autenticação real, proteção de rotas e diferenciação de permissões por perfil. |
| 2 | Disponibilizar criação de demandas com upload de imagem, sugestão automática de categoria, órgão responsável, título e descrição. |
| 3 | Oferecer listagem, filtros, página de detalhe, status e histórico de acompanhamento das demandas registradas. |
| 4 | Implementar painel do gestor com métricas, fila recente, triagem inteligente, foto anexada e sugestão de encaminhamento. |
| 5 | Manter documentação, modelagem, plano de testes e evidências coerentes com a versão final implementada. |

### 2.6 Justificativa

O projeto é relevante porque aproxima cidadão e gestão pública em um fluxo único, claro e rastreável. A possibilidade de anexar foto e receber uma sugestão automática de encaminhamento reduz erros de categorização e torna a abertura da demanda mais rápida. Para o gestor, o painel centraliza indicadores, registros recentes, imagens e sugestões de órgão responsável, apoiando a tomada de decisão.

Além de cumprir os objetivos acadêmicos da disciplina, o Urbanize demonstra aplicação prática de tecnologias modernas de desenvolvimento web, autenticação, persistência, APIs REST, upload de arquivos e classificação inteligente de imagens.

---

## 3. Escopo do Projeto

### 3.1 O que será entregue

Será entregue uma aplicação web funcional, composta por frontend em Next.js e backend em Node.js/Express, com banco persistente via Prisma/SQLite. A solução contempla autenticação, perfis de usuário, registro de demandas, upload de fotos, triagem inteligente, sugestão de órgão responsável, acompanhamento por timeline e painel de gestão.

O projeto contempla:

- Home pública com CTA para registro de demanda direcionando o usuário ao login.
- Cadastro e login de cidadão e gestor.
- Dashboard do cidadão com métricas pessoais e últimas demandas.
- Página de criação de demanda com upload de imagem.
- Classificação de imagem para os cenários: buraco na rua, lixo acumulado na rua e poste ou fiação caída.
- Preenchimento automático de título e descrição com base na sugestão de triagem.
- Listagem e filtros de demandas.
- Página de detalhe com descrição, localização, status, prioridade e histórico.
- Painel do gestor com métricas gerais, fila recente e triagem inteligente.
- Exibição da foto enviada pelo cidadão na área de triagem do gestor.
- Alteração de status e inclusão de observação pelo gestor.
- Backend real com API REST, autenticação, autorização e persistência.
- Documentação técnica, jornadas, requisitos, modelagem, plano de testes e relatório evolutivo.

### 3.2 O que não faz parte do escopo

Não fazem parte do escopo desta entrega:

- Integração oficial com sistemas internos da prefeitura ou concessionárias.
- Envio real de e-mails, SMS, WhatsApp ou notificações push para órgãos externos.
- Aplicativo mobile nativo.
- Geolocalização avançada com mapa interativo.
- Workflow institucional completo com SLA, equipes de campo e ordens de serviço.
- Publicação em ambiente de produção institucional com infraestrutura definitiva.
- Treinamento de modelo próprio de visão computacional; a triagem usa classificação local e fallback configurável no backend.

---

## 4. Planejamento Geral do Projeto

### 4.1 Cronograma de 6 Semanas

| Semana | Período | Planejado | Realizado | Status |
| --- | --- | --- | --- | --- |
| 1 | 11/05/26 a 15/05/26 | Definição inicial do problema, proposta da solução e estrutura do projeto. | Problema, público-alvo, escopo inicial, telas principais e primeira versão do fluxo foram definidos. | Concluído |
| 2 | 18/05/26 a 22/05/26 | Levantamento de requisitos, priorização e modelagem inicial. | Requisitos funcionais e não funcionais, jornada do usuário e modelagem conceitual foram documentados. | Concluído |
| 3 | 25/05/26 a 29/05/26 | Evolução da solução e implementação das funcionalidades principais. | Frontend, rotas, serviços, stores, API backend e persistência começaram a ser integrados. | Concluído |
| 4 | 01/06/26 a 05/06/26 | Testes, validações e ajustes de fluxo. | Plano de testes executado, falhas de navegação e validação identificadas e corrigidas. | Concluído |
| 5 | 08/06/26 a 12/06/26 | Finalização da solução, ajustes visuais e consolidação da entrega. | Backend real, upload, triagem por imagem, preenchimento automático, painel do gestor e documentação final foram ajustados. | Concluído |
| 6 | 15/06/26 a 19/06/26 | Revisão final, relatório evolutivo e organização da apresentação. | Relatório, documentação e coerência entre implementação e artefatos foram revisados. | Concluído |

---

## 5. Acompanhamento Semanal do Projeto

### Semana 1

**Período:** 11/05/26 a 15/05/26

#### 5.1 Atividades realizadas

- Definição do problema central de gestão de demandas urbanas.
- Escolha do nome Urbanize e delimitação do público-alvo.
- Desenho inicial da jornada do cidadão e do gestor.
- Criação da estrutura inicial do frontend.
- Construção das primeiras telas: home, login, cadastro, dashboard, listagem e detalhe de demandas.

#### 5.2 Decisões tomadas

- Trabalhar com dois perfis principais: cidadão e gestor público.
- Usar uma interface web responsiva como canal principal da solução.
- Iniciar com dados demonstrativos e evoluir para backend real nas semanas seguintes.
- Centralizar o acompanhamento da demanda por status e histórico.

#### 5.3 Entregas da semana

| Entrega | Descrição | Status |
| --- | --- | --- |
| Estrutura inicial do projeto | Organização do frontend, páginas e componentes principais. | Concluído |
| Fluxo inicial do cidadão | Telas para cadastro, login, dashboard e criação de demanda. | Concluído |
| Fluxo inicial do gestor | Primeira versão do painel e visualização de demandas. | Concluído |

#### 5.4 Dificuldades encontradas

A principal dificuldade foi transformar a ideia inicial em uma jornada objetiva, separando claramente o que caberia ao cidadão e o que caberia ao gestor. Também foi necessário definir quais recursos seriam essenciais para a primeira versão sem aumentar demais o escopo.

#### 5.5 Próximos passos

- Consolidar requisitos e regras de negócio.
- Definir entidades principais do sistema.
- Evoluir a documentação e preparar a integração com backend.

### Semana 2

**Período:** 18/05/26 a 22/05/26

#### 5.1 Atividades realizadas

- Levantamento e priorização dos requisitos.
- Detalhamento das jornadas de cidadão e gestor.
- Definição dos status das demandas.
- Registro das regras de permissão por perfil.
- Início da modelagem conceitual com usuários, demandas, órgãos e histórico.

#### 5.2 Decisões tomadas

- Manter a demanda como entidade central da aplicação.
- Registrar histórico para cada mudança relevante de status.
- Permitir que gestores visualizem demandas do seu órgão ou, sem vínculo específico, a fila geral.
- Usar triagem automática como apoio ao gestor, mantendo a revisão humana no processo.

#### 5.3 Entregas da semana

| Entrega | Descrição | Status |
| --- | --- | --- |
| Requisitos priorizados | Requisitos funcionais e não funcionais organizados por prioridade. | Concluído |
| Jornada do usuário | Fluxos de cidadão e gestor documentados. | Concluído |
| Modelagem conceitual | Entidades e relacionamentos principais definidos. | Concluído |

#### 5.4 Dificuldades encontradas

A equipe precisou alinhar a profundidade da triagem inteligente para que ela fosse útil sem substituir a decisão do gestor. Também houve cuidado para manter o escopo compatível com o prazo da disciplina.

#### 5.5 Próximos passos

- Implementar backend real.
- Criar endpoints de autenticação e demandas.
- Integrar frontend com API.

### Semana 3

**Período:** 25/05/26 a 29/05/26

#### 5.1 Atividades realizadas

- Implementação da API Express.
- Configuração do Prisma ORM e banco SQLite.
- Criação dos endpoints de autenticação, demandas e métricas.
- Integração do frontend com serviços HTTP.
- Ajustes de store, tipos e rotas protegidas.

#### 5.2 Decisões tomadas

- Usar JWT com cookie HTTP-only para autenticação.
- Aplicar controle de acesso por perfil no backend e no frontend.
- Manter Redis e cron jobs como recursos opcionais, sem impedir a execução local.
- Usar seed para facilitar a demonstração com cidadão e gestor.

#### 5.3 Entregas da semana

| Entrega | Descrição | Status |
| --- | --- | --- |
| Backend Express | API REST com controllers, services, repositories e middlewares. | Concluído |
| Persistência com Prisma | Banco SQLite, schema e seed inicial. | Concluído |
| Integração frontend-backend | Serviços Axios conectados aos endpoints reais. | Concluído |

#### 5.4 Dificuldades encontradas

A integração exigiu ajustes de tipos entre frontend e backend, especialmente em status, categorias, usuários e histórico. Também foi necessário revisar os redirecionamentos após login para respeitar o perfil do usuário.

#### 5.5 Próximos passos

- Executar plano de testes.
- Corrigir validações e filtros.
- Evoluir a triagem de imagem e o painel do gestor.

### Semana 4

**Período:** 01/06/26 a 05/06/26

#### 5.1 Atividades realizadas

- Execução dos cenários do plano de testes.
- Validação dos fluxos de login, cadastro, criação, listagem e detalhe.
- Revisão do painel do gestor.
- Correção de problemas de rota, validação e visualização de status.
- Ajustes na experiência de upload e classificação de imagem.

#### 5.2 Resultados dos testes

| ID | Cenário testado | Resultado final |
| --- | --- | --- |
| TS01 | Login do cidadão | Passou |
| TS02 | Login do gestor | Passou |
| TS03 | Cadastro de usuário | Passou |
| TS04 | Criação de demanda | Passou |
| TS05 | Validação de campos obrigatórios | Passou |
| TS06 | Listagem e filtros de demandas | Passou |
| TS07 | Detalhe da demanda e timeline | Passou |
| TS08 | Dashboard do cidadão | Passou |
| TS09 | Painel do gestor | Passou |
| TS10 | Triagem automática por imagem | Passou |
| TS11 | Atualização de status pelo gestor | Passou |
| TS12 | Responsividade das telas principais | Passou |

#### 5.3 Feedbacks recebidos e ajustes aplicados

| Responsável | Ponto observado | Ajuste aplicado |
| --- | --- | --- |
| Hyngrid | CTA "Registrar demanda" direcionava para dashboard em vez de login. | O botão passou a direcionar para `/login?next=/demandas/nova`. |
| Diego | Histórico exibia contato técnico em formato `mailto:`. | O texto da triagem foi limpo para mostrar apenas a sugestão de órgão. |
| Pamela | Documentação ainda citava dados simulados e API temporária em trechos importantes. | Documentos foram revisados para refletir backend real e fluxo final. |

#### 5.4 Melhorias implementadas

- Remoção de textos e botões que não faziam parte da versão final da interface.
- Ajuste do footer com texto centralizado.
- Correção de erro de hidratação do Chakra UI no Next.js.
- Correção da formatação dos botões de ação do gestor.
- Padronização dos rótulos exibidos para as categorias detectadas.

#### 5.5 Próximos passos

- Finalizar fluxo de preenchimento automático por imagem.
- Exibir fotos anexadas na triagem do gestor.
- Consolidar documentação e relatório final.

### Semana 5

**Período:** 08/06/26 a 12/06/26

#### 5.1 Atividades realizadas

- Ajuste final da tela de criação de demanda.
- Remoção da seção de dados do solicitante e do select de categoria.
- Alteração do texto da área de upload para "Nossa IA classifica a categoria automaticamente".
- Padronização do botão "TIRAR FOTO / ANEXAR IMAGEM" em caixa alta.
- Preenchimento automático de título e descrição após anexar imagem.
- Inclusão da foto, descrição e sugestão de órgão na seção de triagem do gestor.
- Correção do histórico para não exibir links técnicos de contato.
- Revisão de README e documentos da pasta `docs`.

#### 5.2 Entregas finais

| Entrega | Descrição | Status |
| --- | --- | --- |
| Frontend final | Telas públicas, cidadão, gestor, upload, listagem e detalhe ajustados. | Concluído |
| Backend final | API, autenticação, demandas, métricas, upload e triagem integrados. | Concluído |
| Triagem inteligente | Classificação de imagem, sugestão de órgão, título e descrição automáticos. | Concluído |
| Painel do gestor | Métricas, fila recente, foto enviada e sugestão de encaminhamento. | Concluído |
| Documentação | README, jornadas, requisitos, modelagem, plano de testes e relatório revisados. | Concluído |

#### 5.3 Síntese da solução final

A versão final do Urbanize permite que o cidadão registre demandas urbanas com foto, receba preenchimento automático de título e descrição, acompanhe o status e visualize o histórico da solicitação. O gestor acessa um painel próprio com métricas gerais, fila recente e triagem inteligente, podendo revisar a sugestão de encaminhamento e alterar o status da demanda.

O sistema utiliza frontend em Next.js, backend Express, autenticação real, persistência com Prisma/SQLite, upload de imagens e classificação inteligente para apoiar o encaminhamento aos órgãos responsáveis.

#### 5.4 Principais resultados alcançados

- Diferenciação clara entre cidadão e gestor.
- Registro de demandas com imagem e apoio de IA.
- Encaminhamento sugerido para órgão responsável.
- Histórico de acompanhamento mais limpo e compreensível.
- Painel gerencial com informações úteis para tomada de decisão.
- Documentação alinhada ao produto implementado.

#### 5.5 O que ainda poderia ser melhorado

- Integrar o sistema a canais reais de atendimento dos órgãos.
- Adicionar mapa e geolocalização automática.
- Implementar notificações para cidadão e gestor.
- Evoluir a IA para um modelo treinado especificamente com imagens urbanas locais.
- Publicar a solução em ambiente institucional de produção.

---

## 6. Gestão da Equipe

### 6.1 Divisão de responsabilidades

| Integrante | Responsabilidades assumidas | Entregas realizadas | Participação na equipe |
| --- | --- | --- | --- |
| Hyngrid | Frontend, interface, fluxo do usuário, upload, ajustes visuais e validações. | Telas principais, componentes, correções de navegação, responsividade, fluxo de imagem e ajustes finais de UI. | Alta |
| Diego | Backend, banco de dados, autenticação, upload, regras de negócio e endpoints. | API Express, Prisma/SQLite, JWT, rotas de demandas, métricas, upload e triagem. | Alta |
| Pamela | Gestão do projeto, documentação, requisitos, testes e organização das entregas. | Requisitos, jornadas, modelagem, plano de testes, revisão documental e relatório evolutivo. | Alta |

### 6.2 Comunicação da Equipe

A comunicação ocorreu por alinhamentos periódicos, revisão conjunta das entregas e divisão de tarefas por frente de trabalho. A equipe utilizou os documentos do projeto como referência comum para manter requisitos, jornada, testes e implementação coerentes entre si.

### 6.3 Organização do Trabalho

O trabalho foi organizado por semanas, seguindo evolução incremental: definição do problema, requisitos, implementação, testes, ajustes finais e consolidação documental. Cada integrante atuou em uma frente principal, mas as decisões relevantes de escopo, fluxo e correções foram discutidas em conjunto.

---

## 7. Avaliação da Solução Desenvolvida

### 7.1 A solução responde ao problema identificado?

Sim. A solução responde ao problema de fragmentação e baixa transparência na gestão de demandas urbanas ao centralizar o registro, permitir acompanhamento por status, manter histórico da solicitação e apoiar o gestor com triagem inteligente. O cidadão passa a ter um canal claro para registrar e acompanhar demandas, enquanto o gestor recebe informações mais organizadas para análise e encaminhamento.

### 7.2 Pontos fortes da solução

| Ponto forte | Explicação |
| --- | --- |
| Diferenciação de perfis | Cidadão e gestor têm permissões, rotas e fluxos distintos. |
| Upload e classificação de imagem | A foto ajuda a identificar o problema e gerar sugestão de encaminhamento. |
| Preenchimento automático | Título e descrição são preenchidos após a análise da imagem, reduzindo esforço do cidadão. |
| Histórico da demanda | Cada criação ou alteração relevante fica registrada para acompanhamento. |
| Backend real | A aplicação usa API, autenticação e banco persistente, não apenas dados simulados. |
| Documentação consistente | Requisitos, jornadas, modelagem e testes acompanham a versão final do sistema. |

### 7.3 Limitações da solução

| Limitação | Impacto |
| --- | --- |
| Integração externa ainda não implementada | O sistema sugere o órgão, mas não envia automaticamente para sistemas oficiais. |
| IA limitada a categorias previstas | A classificação atende os cenários definidos no projeto, mas pode exigir expansão para novos problemas urbanos. |
| Ausência de mapa interativo | A localização é textual, sem seleção visual por mapa. |
| Ambiente acadêmico/local | A solução ainda precisaria de infraestrutura, segurança operacional e homologação para uso institucional real. |

### 7.4 Potencial de aplicação prática

O Urbanize tem potencial de aplicação em prefeituras, secretarias municipais, ouvidorias, concessionárias e projetos comunitários de zeladoria urbana. Com integrações oficiais, notificações e geolocalização, poderia funcionar como um canal estruturado para recebimento, triagem e acompanhamento de demandas urbanas em escala real.

---

## 8. Aprendizados da Equipe

### 8.1 O que a equipe aprendeu durante o desenvolvimento do projeto?

A equipe aprendeu a transformar um problema urbano em uma solução digital com escopo definido, perfis de usuário, regras de negócio, backend real e documentação de apoio. Também desenvolveu experiência prática com integração frontend-backend, autenticação, persistência, upload de imagens, testes e ajustes de usabilidade a partir de feedback.

### 8.2 Quais competências foram desenvolvidas?

| Competência | Foi desenvolvida? | Comentário da equipe |
| --- | --- | --- |
| Trabalho em equipe | Sim | A divisão por frentes permitiu avanço paralelo e revisão conjunta das decisões. |
| Comunicação | Sim | A equipe precisou alinhar regras, telas, nomes e documentação para evitar divergências. |
| Organização e planejamento | Sim | O cronograma semanal ajudou a acompanhar evolução e pendências. |
| Resolução de problemas | Sim | Foram corrigidos problemas de rota, hidratação, validação, histórico e formatação de interface. |
| Criatividade e inovação | Sim | A triagem por imagem e o preenchimento automático melhoraram a experiência de abertura da demanda. |
| Gestão do tempo | Parcial | O escopo foi concluído, mas algumas revisões finais ficaram concentradas na última semana. |
| Uso de ferramentas digitais | Sim | Foram usadas ferramentas de desenvolvimento, documentação, versionamento, testes e bibliotecas modernas. |
| Pensamento crítico | Sim | A equipe revisou o que fazia sentido manter ou remover para deixar a versão final mais clara. |

### 8.3 Principais desafios enfrentados pela equipe

- Alinhar a documentação com a evolução real do sistema.
- Diferenciar corretamente os fluxos de cidadão e gestor.
- Substituir trechos de simulação por backend real sem quebrar a experiência.
- Ajustar a triagem para apresentar informações úteis sem expor dados técnicos.
- Manter a interface limpa, responsiva e coerente após várias mudanças.

### 8.4 Como a equipe superou os desafios?

A equipe superou os desafios por meio de revisão incremental, testes manuais dos fluxos principais, correção direta dos pontos identificados e atualização contínua da documentação. Também foram priorizadas entregas essenciais para manter a solução funcional e coerente com o objetivo do projeto.

---

## 9. Autoavaliação da Equipe

### 9.1 Avaliação geral da equipe

| Critério | Nota de 0 a 10 | Justificativa |
| --- | --- | --- |
| Organização | 9,0 | A equipe manteve cronograma, divisão de tarefas e documentação de apoio durante o desenvolvimento. |
| Participação dos integrantes | 9,0 | Todos os integrantes contribuíram em frentes relevantes do projeto. |
| Cumprimento dos prazos | 8,5 | As entregas principais foram concluídas, com concentração de ajustes finais na última etapa. |
| Qualidade das entregas | 9,0 | A solução final possui frontend, backend, persistência, autenticação, triagem e documentação coerentes. |
| Comunicação interna | 8,5 | A comunicação permitiu resolver divergências, embora alguns alinhamentos tenham ocorrido tardiamente. |
| Criatividade da solução | 9,0 | A proposta usa imagem e IA para melhorar o registro e a triagem das demandas. |
| Aprendizado durante o projeto | 10,0 | O projeto gerou aprendizado técnico e de gestão, cobrindo do planejamento à entrega funcional. |

### 9.2 Autoavaliação individual

| Integrante | O que contribuiu para o projeto? | O que poderia ter feito melhor? | Nota de participação |
| --- | --- | --- | --- |
| Hyngrid | Contribuiu com desenvolvimento frontend, experiência do usuário, fluxo de upload, ajustes visuais e validações. | Poderia ter antecipado alguns testes de responsividade e inconsistências de navegação. | 9,5 |
| Diego | Contribuiu com backend, autenticação, banco de dados, endpoints, upload e regras de negócio. | Poderia ter documentado antes alguns contratos da API para facilitar a integração. | 9,0 |
| Pamela | Contribuiu com organização do projeto, documentação, requisitos, jornada, modelagem e plano de testes. | Poderia ter revisado com mais frequência os documentos conforme as mudanças de implementação. | 9,0 |
