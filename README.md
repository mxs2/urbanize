# Projeto de Engenharia de Dados - ETL

Pipeline de ETL que extrai dados meteorológicos de **Recife** pela API pública do [Radar Meteorológico](https://radarmeteorologico.com.br/previsao/pe/recife), carrega o resultado bruto no **MongoDB Atlas** (NoSQL), transforma com **pandas** e persiste o resultado em **SQLite** (local) e **NeonDB** (Postgres em nuvem).

## Estrutura do projeto

```
src/
  extract.py    # Extract: endpoints da API Radar Meteorológico + leitura do MongoDB
  transform.py  # Transform: limpeza e DataFrame pronto para carga
  load.py       # Load: MongoDB (load_mongo) e SQLite (load_sqlite)
run_etl.py      # ponto de entrada do pipeline
docker-compose.yml  # opcional: MongoDB local (alternativa ao Atlas)
.env.example    # modelo de variáveis (copie para .env)
jsons/          # saídas opcionais em JSON
```

### `Extract`

- `fetch_cidade_por_ibge(ibge)`: GET `/api/v1/cidades`
- `fetch_temperaturas(limite=107)`: GET `/api/v1/temperaturas`
- `extract_radar_recife()`: consolida Recife (IBGE `2611606`) para carga bruta
- `extract_collection_from_mongo(db_name, collection_name)`: relê todos os dados brutos do MongoDB
- `extract_pending_from_mongo(db_name, collection_name, persisted_mongo_ids)`: só documentos ainda não gravados no SQLite

### `Transform`

- `transform_radar(data)`: DataFrame limpo a partir dos documentos brutos

### `Load`

- `load_mongo(data, db_name, collection_name)`: grava brutos usando `MONGODB_URI` (append histórico por padrão; cada execução adiciona documentos com `ingested_at`)
- `sqlite_mongo_ids(...)`: `mongo_id` já presentes no SQLite
- `load_sqlite(df, ...)`: **append incremental** em `database/radar.db` (chave `mongo_id`, sem regravar a tabela inteira)
- `load_neon(df, nome_tabela)`: append no NeonDB (Postgres) via `DATABASE_URL`

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

## Executando o pipeline

Com o `.env` configurado (e o IP liberado no Atlas):

```bash
python run_etl.py
```

Fluxo:

1. Extração na API Radar Meteorológico (Recife)
2. Carga bruta no MongoDB (append com `ingested_at`)
3. Leitura **apenas** dos documentos do Mongo que ainda não estão no SQLite (`mongo_id`)
4. Transformação desse lote pendente
5. Append na tabela `recife` do arquivo `database/radar.db`
6. Append na tabela `recife` do NeonDB (`DATABASE_URL`)

Se você tinha um `database/radar.db` antigo **sem** a coluna `mongo_id`, apague o arquivo e rode o ETL de novo para backfill a partir do MongoDB.

## Ideias para quem quiser ir além

- Conexão MongoDB **lazy** em `Extract` e `Load`: só conecta quando necessário; o pipeline fecha com `close()` no `finally` de `run_etl.py`.
- Agendar execuções periódicas (cron, Airflow, etc.) para enriquecer o histórico no MongoDB.
- Usar `load_mongo(..., substituir=True)` só em desenvolvimento, quando quiser resetar a coleção.
