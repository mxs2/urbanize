# PRIORIZAÇÃO DE REQUISITOS

A **Priorização de Requisitos** é uma etapa fundamental no desenvolvimento de software, pois ajuda a lidar de forma estratégica com **restrições de tempo, orçamento e esforço de desenvolvimento**. Nem todos os requisitos podem ser implementados de uma vez, e decidir quais funcionalidades devem ser entregues primeiro garante que o sistema entregue valor real aos usuários e ao negócio desde os estágios iniciais.

Diversas técnicas podem ser utilizadas para apoiar essa decisão:

- **MoSCoW**: classifica os requisitos em *Must have* (essenciais), *Should have* (importantes), *Could have* (desejáveis) e *Won't have* (não serão implementados nesta versão), auxiliando na definição clara do que é prioritário.
- **Matriz Valor x Esforço**: avalia cada requisito quanto ao valor que entrega e ao esforço necessário para implementá-lo, ajudando a identificar ganhos rápidos e funções estratégicas.
- **Modelo Kano**: analisa a satisfação do usuário com cada requisito, classificando-os em básicos, de desempenho ou encantamento, permitindo priorizar funcionalidades que aumentem a satisfação.
- **Pontuação ponderada (Weighted Scoring)**: atribui notas a cada requisito com base em critérios relevantes, como valor ao usuário, complexidade ou risco, oferecendo uma visão quantitativa da prioridade.
- **Priorização por dependência**: considera a ordem lógica em que os requisitos devem ser implementados, garantindo que funcionalidades dependentes de outras sejam desenvolvidas na sequência correta.

Em resumo, a priorização de requisitos não apenas **otimiza recursos e tempo**, mas também **garante que o sistema entregue valor significativo e funcionalidade consistente** ao usuário desde as primeiras versões.

## Priorizando os Requisitos

**Técnica de priorização:** MoSCoW

### Justificativa

A técnica escolhida foi **MoSCoW**, pois ela permite classificar os requisitos conforme sua importância para a entrega inicial do sistema. Como o **Urbanize** está em uma fase de consolidação do MVP, essa técnica ajuda a diferenciar funcionalidades essenciais, como cadastro, login, registro e acompanhamento de demandas, de funcionalidades importantes, mas não indispensáveis para a primeira versão, como métricas gerenciais e triagem automática.

Essa abordagem facilita a organização do backlog, melhora a comunicação da equipe e mantém coerência entre o problema identificado na análise de domínio, os objetivos SMART e as funcionalidades propostas para a solução.

### Abordagem

Os requisitos foram classificados de acordo com as categorias da técnica MoSCoW:

- **Must have**: funcionalidades indispensáveis para que o sistema entregue seu valor principal.
- **Should have**: funcionalidades importantes para melhorar o uso e a gestão, mas que não impedem o funcionamento básico.
- **Could have**: funcionalidades desejáveis, que agregam valor, mas podem ser entregues depois do MVP.
- **Won't have**: funcionalidades fora do escopo desta versão.

Foram considerados **Must have** os requisitos ligados ao fluxo principal do Urbanize: acesso ao sistema, registro de demandas, acompanhamento da solicitação e atualização do andamento pelo gestor. Foram classificados como **Should have** os recursos que aumentam a eficiência operacional, como filtros, métricas, triagem e upload de imagem para evidência da ocorrência. Como **Could have** ficaram funcionalidades úteis para melhorar a experiência, mas que não impedem o funcionamento principal. Como **Won't have** foram classificadas funcionalidades de maior complexidade ou dependência de infraestrutura externa não implementada nesta versão, como notificações e mapa interativo.

| ID da História de Usuário | Prioridade |
| --- | --- |
| 001 | Must have |
| 002 | Must have |
| 003 | Must have |
| 004 | Must have |
| 005 | Must have |
| 006 | Should have |
| 007 | Should have |
| 008 | Should have |
| 009 | Should have |
| 010 | Could have |
| 011 | Won't have |
| 012 | Should have |
| 013 | Won't have |

### Backlog priorizado

| ID | História de Usuário | Prioridade |
| --- | --- | --- |
| 001 | Como cidadão, quero cadastrar minha conta no Urbanize para acessar o sistema e registrar demandas urbanas com meu perfil de usuário. | Must have |
| 002 | Como cidadão ou gestor, quero fazer login na plataforma para acessar as funcionalidades correspondentes ao meu perfil. | Must have |
| 003 | Como cidadão, quero registrar uma nova demanda informando foto, título, descrição, prioridade e localização para comunicar problemas urbanos à gestão pública de forma organizada. | Must have |
| 004 | Como cidadão, quero acompanhar o status e o histórico de uma demanda para saber como minha solicitação está evoluindo. | Must have |
| 005 | Como gestor, quero atualizar o status e registrar observações na demanda para manter o histórico do atendimento rastreável. | Must have |
| 006 | Como cidadão ou gestor, quero visualizar e filtrar demandas cadastradas para encontrar rapidamente solicitações específicas. | Should have |
| 007 | Como gestor, quero acessar um painel com métricas e fila recente para monitorar e priorizar demandas urbanas. | Should have |
| 008 | Como gestor, quero revisar a triagem automática para validar categoria, confiança e sugestão de encaminhamento. | Should have |
| 009 | Como gestor, quero aceitar a sugestão de encaminhamento para direcionar a demanda ao órgão adequado. | Should have |
| 010 | Como cidadão, quero consultar um dashboard resumido para acompanhar indicadores das minhas solicitações. | Could have |
| 011 | Como cidadão, quero receber notificações por e-mail ou SMS sempre que o status da minha demanda for atualizado para me manter informado sem precisar acessar o sistema. | Won't have |
| 012 | Como cidadão, quero anexar fotos ao registrar uma demanda para evidenciar visualmente o problema urbano relatado. | Should have |
| 013 | Como cidadão, quero visualizar a localização da minha demanda em um mapa interativo para identificar geograficamente onde o problema está ocorrendo. | Won't have |

### Justificativas das decisões tomadas

As histórias **001, 002, 003, 004 e 005** foram classificadas como **Must have** porque sustentam o fluxo mínimo de funcionamento do Urbanize. Sem cadastro ou login, os usuários não acessam a plataforma. Sem registro de demanda, o sistema não cumpre seu objetivo principal. Sem acompanhamento e atualização de status, a solução perde rastreabilidade e não fecha o ciclo entre cidadão e gestão.

As histórias **006, 007, 008, 009 e 012** foram classificadas como **Should have** porque ampliam a eficiência da operação. A listagem com filtros, o painel do gestor, a triagem automática, o encaminhamento e o upload de fotos apoiam a organização do trabalho e a tomada de decisão, mas dependem primeiro da existência das demandas e do fluxo básico de atendimento.

A história **010** foi classificada como **Could have** porque o dashboard do cidadão melhora a experiência e a visibilidade dos indicadores, mas não é indispensável para que o cidadão registre uma demanda e acompanhe seu andamento.

As histórias **011 e 013** foram classificadas como **Won't have** nesta versão porque dependem de infraestrutura externa ou integrações não priorizadas, como serviço de e-mail/SMS e API de mapas. O upload de imagens foi antecipado e implementado com armazenamento local, pois passou a sustentar a triagem inteligente.

### Coerência com os objetivos SMART

A priorização mantém alinhamento com os objetivos SMART definidos anteriormente, pois coloca como prioridade máxima as funcionalidades que permitem registrar demandas, gerar protocolo, acompanhar status, manter histórico e atualizar o atendimento. As funcionalidades de apoio, como métricas, filtros e triagem, foram mantidas em prioridade intermediária por contribuírem para organização e eficiência da gestão, sem substituir o fluxo principal da solução.
