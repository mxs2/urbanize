# Urbanize — Análise e Escolha do Banco de Dados

## 1. Caracterização Geral do Projeto

| Característica | Descrição |
|---|---|
| **Sistema** | Plataforma de Gerenciamento de Demandas Públicas Urbanas (modelo 311-like) |
| **Escala** | Municipal, com potencial de expansão multi-município |
| **Usuários** | Cidadãos (munícipes), Gestores Públicos, Administradores do sistema |
| **Criticidade** | Alta — impacta diretamente a prestação de serviços públicos essenciais (saneamento, energia, infraestrutura) |
| **Dados sensíveis** | Sim — dados pessoais do cidadão (nome, CPF, contato), localização (endereço/geolocalização), fotos de propriedades/vias públicas |
| **Conformidade** | LGPD (Lei Geral de Proteção de Dados), possível auditoria por órgãos de controle municipal |
| **Volume inicial estimado** | Baixo a médio (fase piloto / MVP), com crescimento orgânico conforme adoção |
| **Componente de IA** | Classificação automática de imagens (TensorFlow/MobileNet) gerando metadados semiestruturados (labels, scores de confiança) |
| **Natureza dos dados** | Predominantemente estruturada e relacional (usuários, demandas, status, órgãos), com componentes semiestruturados (resultado da IA, EXIF de fotos) |

### Principais entidades do domínio (visão preliminar)

- **Usuário** (cidadão, gestor, administrador)
- **Demanda/Chamado** (problema reportado)
- **Foto/Evidência** (com metadados EXIF e geolocalização)
- **Categoria de Problema** (saneamento, elétrico, pavimentação, etc.)
- **Órgão Responsável** (entidade pública destinatária)
- **Triagem da IA** (resultado da classificação automática)
- **Status/Histórico** (linha do tempo do chamado)
- **Endereço/Localização**

Esse conjunto de entidades apresenta relações fortes e bem definidas entre si (1:N e N:N), com necessidade de garantias de integridade — é o primeiro indicativo de que um modelo **relacional** é o ponto de partida mais natural.

---

## 2. Relacional vs. Não-Relacional: Por que Relacional?

### 2.1 Natureza dos dados do Urbanize

O núcleo do sistema gira em torno de **entidades com relacionamentos rígidos e auditáveis**:

- Um chamado **pertence a** um cidadão, **está associado a** um endereço, **possui** uma ou mais fotos, **recebe** uma triagem da IA, **é direcionado a** um órgão, e **percorre** um histórico de status.
- Essas relações precisam de **integridade referencial garantida**: não pode existir um chamado sem cidadão, nem um encaminhamento sem órgão válido.
- O fluxo "IA classifica → gestor revisa/corrige → encaminha ao órgão" é uma **máquina de estados transacional**, onde cada transição deve ser atômica e auditável (requisito de LGPD/auditoria municipal).

Esses são exatamente os pontos fortes de bancos relacionais (RDBMS): **ACID, FKs, constraints, JOINs eficientes e consultas analíticas**.

### 2.2 Onde o não-relacional brilharia (e por que não é prioridade aqui)

Bancos NoSQL (documentais, como MongoDB) se destacam quando:
- O esquema é altamente variável/dinâmico entre registros;
- Não há necessidade forte de relações entre entidades;
- A escala exige sharding horizontal massivo desde o início (milhões de escritas/segundo).

**Nenhum desses cenários** descreve o Urbanize no horizonte de 7 anos. O componente "menos estruturado" do sistema — o resultado da triagem da IA (labels, scores, metadados) — pode ser perfeitamente acomodado dentro de um RDBMS moderno via colunas `JSON`/`JSONB`, sem necessidade de um banco dedicado.

---

## 3. Comparação entre 4 Bancos de Dados

Para validar a escolha, comparamos o PostgreSQL com mais três alternativas — uma relacional (MySQL) e duas não-relacionais (MongoDB e DynamoDB).

| Critério | **PostgreSQL** (Relacional) | **MySQL** (Relacional) | **MongoDB** (Documental) | **DynamoDB** (Chave-valor/Documental) |
|---|---|---|---|---|
| **Modelagem de relacionamentos (FKs, JOINs)** | Excelente, nativo e maduro | Bom, mas histórico de limitações em FKs com certas engines (MyISAM) | Requer denormalização ou `$lookup` (mais custoso) | Inexistente — relações tratadas na aplicação |
| **Integridade referencial / Constraints** | Forte (FK, CHECK, UNIQUE, EXCLUSION) | Forte com InnoDB | Fraca — depende de validação na aplicação | Inexistente |
| **Transações ACID multi-tabela** | Sim, robusto | Sim (InnoDB) | Suporte a transações multi-documento desde v4.0, porém com overhead | Transações limitadas (TransactWriteItems), com restrições de itens |
| **Dados semiestruturados (JSON)** | `JSONB` indexável, com operadores nativos e performance próxima a colunas nativas | `JSON` suportado, mas indexação menos eficiente que JSONB | Nativo (é a estrutura padrão) | Suporte a documentos, mas com limites de tamanho de item (400KB) |
| **Suporte geoespacial** | Excelente via extensão **PostGIS** (referência de mercado) | Suporte geoespacial básico | Suporte geoespacial nativo (2dsphere), bom para queries simples | Limitado — geralmente requer índices secundários customizados |
| **Consultas analíticas / agregações (dashboards do gestor)** | Excelente (window functions, CTEs, views materializadas) | Bom, porém com recursos analíticos mais limitados que Postgres | Aggregation Framework funcional, mas verboso para relatórios complexos | Fraco — não é desenhado para queries analíticas ad-hoc |
| **Escalabilidade horizontal** | Boa via read replicas e partitioning; sharding nativo limitado (requer Citus ou similar) | Similar ao Postgres | Excelente — sharding nativo desde o design | Excelente — escala automaticamente, serverless |
| **Custo operacional / complexidade** | Médio — pode ser self-hosted ou gerenciado (RDS, Supabase, Neon) | Médio, similar ao Postgres | Médio-alto (Atlas) | Baixo operacionalmente, mas custo pode crescer com volume de leitura/escrita |
| **Compatibilidade com Prisma** | Suporte de primeira classe (provider oficial) | Suporte de primeira classe | Suporte via Prisma, porém histórico de menor maturidade (sem relations nativas, transações limitadas) | Sem suporte nativo direto no Prisma (exigiria camada própria) |
| **Maturidade para compliance/auditoria (LGPD)** | Excelente — triggers, logs nativos, row-level security | Boa, similar ao Postgres | Possível, mas exige mais trabalho de aplicação | Possível via DynamoDB Streams, porém com mais engenharia |
| **Migração a partir do SQLite atual (Prisma)** | Trivial — troca de provider, schema relacional preservado | Trivial, mas sem ganho relevante sobre Postgres | Reescrita significativa do schema e da lógica de acesso a dados | Reescrita completa da camada de dados |
| **Adequação ao caso de uso Urbanize** | ✅ Ideal | ⚠️ Viável, mas sem vantagens sobre Postgres | ⚠️ Viável para o módulo de IA isoladamente, mas geraria arquitetura poliglota desnecessária | ❌ Inadequado para o core relacional do sistema |

### Por que PostgreSQL vence cada concorrente

**vs. MySQL**: ambos são relacionais maduros e cobririam o caso de uso básico, mas o PostgreSQL leva vantagem em três pontos decisivos para o Urbanize: (1) `JSONB` com indexação eficiente para os resultados da IA, (2) `PostGIS`, o padrão de mercado para dados geoespaciais (essencial para endereços/coordenadas de chamados), e (3) recursos analíticos mais ricos para os dashboards dos gestores. Não há motivo técnico para preferir MySQL aqui.

**vs. MongoDB**: o MongoDB seria competitivo *apenas* para armazenar os resultados brutos da triagem de IA (documentos variáveis). Mas o core do Urbanize — usuários, chamados, status, órgãos — é fortemente relacional. Usar MongoDB forçaria denormalização extensiva ou múltiplas queries para reconstruir relações simples (ex: "todos os chamados de saneamento do bairro X com status pendente"), além de fragilizar a integridade referencial em um sistema que lida com dados sensíveis e exige auditoria.

**vs. DynamoDB**: excelente para escala massiva e baixa latência em padrões de acesso simples e previsíveis (chave-valor), mas pessimamente adequado para consultas ad-hoc e relatórios — exatamente o que os gestores municipais vão precisar (filtros por bairro, categoria, período, status). Modelar o Urbanize em DynamoDB exigiria desenhar índices secundários para cada padrão de consulta antecipadamente, com baixa flexibilidade para mudanças futuras.

---

## 4. Análise de Escalabilidade (Projeção de 7 Anos)

### 4.1 Estimativa de volume de dados

Considerando uma adoção realista em escala municipal (ex.: Recife, ~1,6 milhão de habitantes):

| Cenário | Premissas | Registros/ano em `requests` | Acumulado em 7 anos |
|---|---|---|---|
| **Conservador** | 2% da população usa o app, 1 chamado/ano por usuário ativo | ~32.000 | ~224.000 |
| **Moderado** | 5% de adoção, 2 chamados/ano | ~160.000 | ~1.120.000 |
| **Otimista (expansão multi-município)** | Adoção por 3-5 cidades médias adicionais | múltiplos do moderado | ~3-5 milhões |

**Conclusão**: mesmo no cenário otimista, estamos na faixa de **baixos milhões de registros** na tabela principal — um volume que o PostgreSQL administra com folga usando indexação adequada, sem necessidade de soluções distribuídas complexas.

### 4.2 Estratégias de escalabilidade disponíveis no PostgreSQL

1. **Indexação**: índices B-tree para buscas por status/categoria/data, e índices GIN para campos `JSONB` (resultado da IA) e busca textual.
2. **Particionamento de tabelas** (table partitioning): a tabela `requests` pode ser particionada por ano ou por município, mantendo performance de consulta mesmo com milhões de linhas.
3. **Índices geoespaciais (PostGIS/GiST)**: fundamentais para consultas como "chamados em um raio de X km" ou agrupamento por bairro/zona.
4. **Read Replicas**: dashboards de gestores (leitura intensiva) podem ser direcionados a réplicas, isolando a carga de escrita dos cidadãos.
5. **Cache com Redis (já presente via `ioredis`)**: para dados de leitura frequente (ex.: lista de categorias, órgãos responsáveis, contadores de dashboard), reduzindo carga no banco principal.
6. **Arquivamento de dados antigos**: chamados resolvidos há mais de X anos podem ser movidos para tabelas de arquivo, mantendo a tabela operacional "enxuta".
7. **Object storage para fotos**: as imagens nunca residem no banco — apenas referências (URLs/paths) — o que mantém o crescimento do banco de dados desacoplado do volume de mídia, que cresce muito mais rápido.

### 4.3 Quando reconsiderar a escolha

Um cenário que justificaria revisitar a arquitetura (ex.: introduzir um componente NoSQL adicional) seria:
- Adoção em **dezenas de municípios simultaneamente** com picos de escrita extremamente altos (>1.000 escritas/segundo sustentadas);
- Necessidade de armazenar **logs de telemetria de altíssimo volume** (ex.: eventos de uso do app a cada interação).

Nenhum desses cenários é esperado para o Urbanize dentro do horizonte de 7 anos descrito.

---

## 5. Casos de Uso e Impacto da Escolha

### Caso 1 — Triagem da IA com revisão do gestor
**Fluxo**: cidadão envia foto → IA classifica e preenche formulário → gestor avalia (aceita/corrige) → chamado é encaminhado ao órgão.

**Impacto da escolha relacional**: este fluxo é uma máquina de estados (`pendente` → `em_triagem` → `revisado` → `encaminhado` → `resolvido`). Em PostgreSQL, isso é modelado com uma tabela de status/histórico ligada por FK ao chamado, com transações garantindo que a mudança de status e o registro de auditoria ocorram atomicamente. Em um NoSQL documental, essa garantia precisaria ser replicada na lógica da aplicação, aumentando risco de inconsistência — crítico em um sistema com requisitos de auditoria.

### Caso 2 — Dashboard do gestor (relatórios e indicadores)
**Fluxo**: gestor visualiza "chamados de saneamento, bairro X, últimos 30 dias, agrupados por status".

**Impacto da escolha relacional**: consultas agregadas multi-tabela com `GROUP BY`, `JOIN` e filtros geoespaciais são o ponto forte clássico do SQL. Em PostgreSQL, isso pode ser otimizado com views materializadas atualizadas periodicamente (via `node-cron`, já presente no stack).

### Caso 3 — Armazenamento do resultado bruto da IA (MobileNet)
**Fluxo**: o modelo TensorFlow retorna labels e scores de confiança variáveis conforme a imagem.

**Impacto da escolha relacional**: uma coluna `JSONB` na tabela de triagem armazena esse resultado de forma flexível, mantendo a possibilidade de indexar e consultar campos específicos (ex.: `confidence_score > 0.8`) sem rigidez de schema — o melhor dos dois mundos, sem precisar de um banco NoSQL separado.

### Caso 4 — Dados pessoais e LGPD
**Fluxo**: cidadão solicita exclusão/anonimização de seus dados.

**Impacto da escolha relacional**: com FKs bem definidas e `ON DELETE`/`ON UPDATE` configurados, operações de anonimização em cascata (ou exclusão lógica via soft delete) são previsíveis e auditáveis — um requisito direto da LGPD.

### Caso 5 — Migração a partir do estado atual (SQLite + Prisma)
**Fluxo**: o projeto já possui um schema Prisma rodando sobre SQLite com dados mockados.

**Impacto da escolha relacional**: a migração para PostgreSQL via Prisma é incremental — troca-se o `provider` no `schema.prisma` e o adapter (`@prisma/adapter-pg` no lugar de `@prisma/adapter-better-sqlite3`), preservando toda a modelagem relacional já pensada. Uma migração para um banco não-relacional exigiria reescrever schema, queries e a camada de acesso a dados do zero.

---

## 6. Consenso Técnico

A escolha do **PostgreSQL** para o Urbanize é fundamentada em quatro pilares:

1. **Aderência ao domínio**: o sistema é predominantemente relacional — usuários, chamados, órgãos, categorias e status possuem relações claras (1:N e N:N) que se beneficiam diretamente de FKs, constraints e JOINs.

2. **Flexibilidade sem fragmentação**: o suporte nativo a `JSONB` cobre os dados semiestruturados do componente de IA, evitando a necessidade de uma arquitetura poliglota (SQL + NoSQL) desnecessária para o estágio e a escala do projeto.

3. **Escalabilidade adequada ao horizonte de 7 anos**: o volume projetado (centenas de milhares a poucos milhões de registros) está confortavelmente dentro da capacidade do PostgreSQL com boas práticas de indexação, particionamento e cache (Redis já presente no stack).

4. **Compatibilidade e continuidade**: suporte de primeira classe no Prisma, migração direta a partir do SQLite atual, recursos maduros de segurança/auditoria para conformidade com LGPD, e o ecossistema PostGIS para os requisitos geoespaciais do projeto.

**Recomendação final**: **PostgreSQL** como banco de dados principal único do Urbanize, com **Redis** (já no stack via `ioredis`) atuando como camada de cache complementar — sem necessidade de banco NoSQL adicional.