# Projeto de Engenharia de Dados - ETL

Pipeline de ETL que extrai dados meteorológicos de **Recife** pela API pública do [Radar Meteorológico](https://radarmeteorologico.com.br/previsao/pe/recife), carrega o resultado bruto no **MongoDB Atlas** (NoSQL), transforma com **pandas** e persiste o resultado em **SQLite** (local) e **NeonDB** (Postgres em nuvem). Um dashboard em **Streamlit** lê a tabela final do Neon.

## Estrutura do projeto

```
src/
  config.py     # Configuração: lê o .env uma única vez e expõe as variáveis para os demais módulos
  extract.py    # Extract: endpoints da API Radar Meteorológico + leitura do MongoDB
  transform.py  # Transform: limpeza e DataFrame pronto para carga
  load.py       # Load: MongoDB (load_mongo), SQLite (load_sqlite) e NeonDB (load_neon)
dashboard/
  app.py        # dashboard em Streamlit que lê a tabela recife do Neon
run_etl.py      # ponto de entrada do pipeline
orchestration_prefect.py  # o mesmo pipeline orquestrado com Prefect (tasks + flow etl_radar_flow)
docker-compose.yml  # opcional: MongoDB local (alternativa ao Atlas)
.env.example    # modelo de variáveis (copie para .env)
jsons/          # saídas opcionais em JSON
```

### Camadas de dados

| Camada | Onde fica | Como é gravada |
|--------|-----------|----------------|
| **Bronze** (dado bruto, como veio da API) | coleção `radar_recife_raw` do banco `urbanize_etl` no MongoDB | só recebe inserções: cada execução **acrescenta** um documento marcado com `data_extracao`, e nada é apagado |
| **Prata** (dado tratado, pronto para análise) | tabela `recife` no SQLite (`database/radar.db`) e no Neon | recebe a carga mais recente em **append**, sem apagar as anteriores; o `mongo_id` impede que o mesmo documento seja gravado duas vezes |

Diferente do exemplo da PNADC, a tabela final aqui **não** é substituída a cada execução: a API só devolve a condição do tempo *no momento da consulta*, então o histórico de leituras só existe porque cada execução acrescenta uma linha.

### `config`

- `src/config.py` chama `load_dotenv()` uma única vez e expõe `MONGODB_URI`, `MONGODB_DB`, `MONGODB_RAW_COLLECTION` e `DATABASE_URL`. Os demais módulos importam daqui (`import src.config as config`) em vez de repetir `os.getenv()` em cada arquivo.

### `Extract`

- `fetch_cidade_por_ibge(ibge)`: GET `/api/v1/cidades`
- `fetch_temperaturas(limite=107)`: GET `/api/v1/temperaturas`
- `extract_radar_recife()`: consolida Recife (IBGE `2611606`) para carga bruta
- `extract_collection_from_mongo(db_name, collection_name)`: relê **todos** os documentos da coleção (o histórico completo de cargas)
- `extract_latest_from_mongo(db_name, collection_name)`: relê apenas os documentos da **carga mais recente** (maior `data_extracao`), para alimentar a transformação

### `Transform`

- `transform_radar(data)`: DataFrame limpo a partir dos documentos brutos, com **uma linha por documento**. Valores ausentes viram nulo (ver [Melhorias](#melhorias-aplicadas)).

### `Load`

- `load_mongo(data, db_name, collection_name)`: acrescenta `data_extracao` (data e hora da carga, em UTC) a cada documento e insere na coleção. A coleção nunca é apagada.
- `sqlite_mongo_ids(...)` / `neon_mongo_ids(...)`: `mongo_id` já presentes no SQLite / no Neon
- `load_sqlite(df, ...)`: **append incremental** em `database/radar.db`, ignorando `mongo_id` já gravados
- `load_neon(df, nome_tabela)`: **append incremental** no NeonDB via `config.DATABASE_URL`, ignorando `mongo_id` já gravados

## Melhorias aplicadas

Melhorias pedidas a partir do exemplo da aula (pipeline PNADC) e como cada uma se aplica a este projeto.

### 1. `.env` lido uma única vez

`src/config.py` é o único arquivo que chama `load_dotenv()` e `os.getenv()`. `extract.py`, `load.py`, `run_etl.py`, `orchestration_prefect.py`, `dashboard/app.py` e `exemplos/teste_mongo.py` importam as variáveis de lá.

### 2. Tudo o que a fonte entrega chega ao destino?

- **Índices fixos:** o `Transform` não tem nenhum `[0]`; cada documento da bronze vira exatamente uma linha. O único `[0]` estava no `Extract` (`cidades[0]` na busca por código IBGE). A API devolve uma cidade só, mas agora o código filtra pelo IBGE e falha se vier um número diferente de 1, em vez de descartar o resto sem aviso.
- **Bronze × tabela final:** a comparação mostrou um problema real. Eram **11 documentos na bronze, 11 linhas no SQLite e 35 no Neon**, com só 11 `mongo_id` distintos: execuções antigas tinham gravado o mesmo documento até 4 vezes. As 24 duplicatas foram removidas, a tabela ganhou um índice único em `mongo_id` e o `load_neon` passou a ignorar documentos já gravados. Hoje as três camadas têm a mesma quantidade de registros, e reexecutar a carga (por exemplo, numa retentativa do Prefect) não duplica nada.
- **Limitação da fonte:** o endpoint `/api/v1/temperaturas` devolve no máximo 50 cidades em `mais_quentes` e 50 em `mais_frias`, ou seja, 100 das 107 monitoradas, qualquer que seja o `limite`. Se o Recife ficar entre as 7 cidades do meio, ele não aparece e a extração falha com um erro explícito; nada é gravado incompleto. Na prática o Recife fica entre as mais quentes.
- **Metadados:** `_api_cidade` (slug, fuso etc.) e `_api_temperaturas_meta` (fonte e atribuição da API) são guardados na bronze e não vão para a tabela final, porque são iguais em todas as leituras.

### 3. Dado ausente vira nulo, não zero

Na API do Radar, o valor ausente vem como `null` no JSON, que o pandas já lê como nulo. Até agora nenhuma leitura gravada veio com campo ausente. Mesmo assim, o `Transform` trata como nulo os marcadores comuns de "sem dado" (`""`, `"-"`, `"--"`, `"N/A"`, `"..."`, `"null"`, `"None"`). Isso importa nesta fonte porque **zero é valor real**: `chuva_mm = 0` é "não choveu" e `codigo_wmo = 0` é "céu limpo". A conversão numérica não usa `errors="coerce"`, então um valor inesperado (como `"trinta"`) faz a transformação falhar em vez de virar nulo sem ninguém perceber.

### 4. `data_extracao` e leitura só da carga mais recente

Cada carga na bronze recebe `data_extracao` (substituiu o antigo `ingested_at`), e a transformação lê só a carga mais recente com `extract_latest_from_mongo`. Nada é apagado: a bronze guarda todas as cargas, e a tabela final recebe a nova carga em append. Os 11 documentos que já existiam ganharam `data_extracao` com o valor de `ingested_at`, e a coluna foi renomeada nas tabelas do SQLite e do Neon.

## Configuração do ambiente

### Python (venv)

**Linux/Mac**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows**

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### MongoDB (Atlas)

O pipeline usa um cluster **MongoDB Atlas** por padrão.

1. Copie o modelo de variáveis e preencha o `.env`:

```bash
cp .env.example .env
```

2. Em `MONGODB_URI`, use a connection string do seu cluster (Atlas → **Connect** → **Drivers**), no formato `mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/`.
3. No Atlas, em **Security → Network Access**, libere o IP da sua máquina. Sem isso a conexão falha com `SSL handshake failed` / `ServerSelectionTimeoutError`.
4. Para ver os dados brutos: **Database → Clusters → Browse Collections** → banco `urbanize_etl` → coleção `radar_recife_raw`.

#### Alternativa: MongoDB local com Docker (opcional)

Se preferir não usar o Atlas, suba um MongoDB local e aponte o `MONGODB_URI` para ele (`mongodb://urbanize:urbanize_secret@localhost:27017/?authSource=admin`):

```bash
docker compose up -d
docker compose ps
```

O `docker-compose.yml` lê usuário, senha e porta do `.env`.

### Variáveis de ambiente (`.env`)

| Variável | Descrição |
|----------|-----------|
| `MONGODB_URI` | Connection string do MongoDB (Atlas `mongodb+srv://...` ou local) |
| `MONGODB_DB` | Banco dos dados brutos |
| `MONGODB_RAW_COLLECTION` | Coleção bruta |
| `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` | Só para o Docker local: credenciais do container |
| `MONGODB_PORT` | Só para o Docker local: porta publicada no host |
| `DATABASE_URL` | Connection string do NeonDB (Postgres em nuvem) |

Esse arquivo é lido apenas por `src/config.py`. Para usar uma variável em um módulo novo, importe-a de lá:

```python
import src.config as config

engine = create_engine(config.DATABASE_URL)
```

## Executando o pipeline

Com o `.env` configurado (e o IP liberado no Atlas):

```bash
python run_etl.py
```

Fluxo:

1. Extração na API Radar Meteorológico (Recife)
2. Carga bruta no MongoDB (append, com `data_extracao`)
3. Leitura **apenas** da carga mais recente e transformação
4. Append na tabela `recife` do arquivo `database/radar.db`
5. Append na tabela `recife` do NeonDB (`DATABASE_URL`)

Para conferir no **SQL Editor** do Neon se a tabela final bate com a bronze:

```sql
-- total de linhas e de documentos distintos (devem ser iguais à contagem da coleção no Mongo)
SELECT COUNT(*), COUNT(DISTINCT mongo_id) FROM recife;

-- quantas leituras têm cada campo preenchido (as demais são NULL)
SELECT COUNT(*), COUNT(temperatura), COUNT(chuva_mm) FROM recife;
```

## Orquestração com Prefect

O arquivo `orchestration_prefect.py` define o mesmo pipeline como um *flow* do [Prefect](https://www.prefect.io) (`etl_radar_flow`, nome "ETL Radar Recife Prefect"), dividido em *tasks*:

| Task | O que faz | Retentativas |
|------|-----------|--------------|
| `extract` | busca Recife na API Radar Meteorológico (`Extract.extract_radar_recife`) | 3, com 10 s de intervalo |
| `load_data` | insere o resultado bruto no MongoDB (`Load.load_mongo`) | — |
| `transform` | relê do MongoDB a carga mais recente (`extract_latest_from_mongo`) e gera o DataFrame | — |
| `load_sqlite` | append incremental na tabela `recife` de `database/radar.db` | — |
| `load_neon` | append incremental na tabela `recife` do NeonDB | 3, com 10 s de intervalo |

As tasks são chamadas em sequência dentro do flow, e cada uma recebe o resultado da anterior. Por isso, se uma etapa falhar (depois das retentativas), as seguintes não chegam a rodar. O flow também tem `retries=3` e usa o logger do Prefect (`get_run_logger`) para registrar quantos registros passaram por cada etapa.

Para acompanhar as execuções pela interface web, suba o servidor local em um terminal:

```bash
prefect server start
```

Em outro terminal (com o venv ativo), aponte o cliente para esse servidor (só na primeira vez) e rode o flow:

```bash
prefect config set PREFECT_API_URL=http://127.0.0.1:4200/api
```

```bash
python orchestration_prefect.py
```

Acesse http://127.0.0.1:4200: em **Runs** aparecem as execuções do flow, com o grafo das tasks, o estado de cada uma (Completed, Failed), os logs e as retentativas.

## Dashboard

O diretório `dashboard/` contém um dashboard em Streamlit que lê a tabela `recife` do Neon (a camada prata, gravada pelo pipeline), usando a conexão de `src/config.py`, e mostra:

- filtros por período e por condição do tempo;
- indicadores (`st.metric`) da última leitura: temperatura (com a variação em relação à leitura anterior), quantidade de leituras, maior máxima e chuva média no período;
- a temperatura ao longo do tempo, com a faixa entre mínima e máxima do dia;
- a chuva de cada leitura, em barras;
- as leituras em tabela.

Rode o pipeline pelo menos uma vez antes (para a tabela existir) e, a partir da raiz do projeto:

```bash
python -m streamlit run dashboard/app.py
```

O dashboard abre no navegador em `http://localhost:8501`. Use `python -m streamlit` (e não só `streamlit run`): o `-m` coloca a raiz do projeto no caminho de busca de módulos do Python, e é isso que permite ao `app.py` importar `src.config`. Sem ele, o resultado é `ModuleNotFoundError: No module named 'src'`.

A consulta ao Neon fica em cache por 10 minutos (`@st.cache_data(ttl=600)`). Se acabou de rodar o pipeline e não vê os dados novos, use o menu **⋮ → Clear cache** do Streamlit ou reinicie o dashboard.

## Ideias para quem quiser ir além

- Conexão MongoDB **lazy** em `Extract` e `Load`: só conecta quando necessário; o pipeline fecha com `close()` no `finally` de `run_etl.py`.
- Agendar execuções periódicas (por exemplo com `etl_radar_flow.serve(cron="0 * * * *")` no Prefect) para enriquecer o histórico e deixar os gráficos do dashboard mais densos.
