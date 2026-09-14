# Projeto de Engenharia de Dados - ETL

Pipeline de ETL que extrai dados meteorológicos de **Recife** pela API pública do [Radar Meteorológico](https://radarmeteorologico.com.br/previsao/pe/recife), carrega o resultado bruto no **MongoDB** (Docker), transforma com **pandas** e persiste o resultado em **SQLite**.

## Estrutura do projeto

```
src/
  extract.py    # Extract: endpoints da API Radar Meteorológico + leitura do MongoDB
  transform.py  # Transform: limpeza e DataFrame pronto para carga
  load.py       # Load: MongoDB (load_mongo) e SQLite (load_sqlite)
run_etl.py      # ponto de entrada do pipeline
docker-compose.yml
.env.example    # modelo de variáveis (copie para .env)
jsons/          # saídas opcionais em JSON
```

### `Extract`

- `fetch_cidade_por_ibge(ibge)`: GET `/api/v1/cidades`
- `fetch_temperaturas(limite=107)`: GET `/api/v1/temperaturas`
- `extract_radar_recife()`: consolida Recife (IBGE `2611606`) para carga bruta
- `extract_collection_from_mongo(db_name, collection_name)`: relê dados brutos do MongoDB

### `Transform`

- `transform_radar(data)`: DataFrame limpo a partir dos documentos brutos

### `Load`

- `load_mongo(data, db_name, collection_name)`: grava brutos usando `MONGODB_URI` (append histórico por padrão; cada execução adiciona documentos com `ingested_at`)
- `load_sqlite(df, ...)`: grava tabela SQLite local (`radar.db` por padrão)

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

### MongoDB com Docker

1. Copie as variáveis de ambiente e modifique a .env com suas variáveis:

```bash
cp .env.example .env
```

2. Suba o container:

```bash
docker compose up -d
```

3. Confirme que o serviço está saudável:

```bash
docker compose ps
```

O `docker-compose.yml` lê usuário, senha e porta do arquivo `.env`. A URI que o Python usa é `MONGODB_URI` (também no `.env`).

### Variáveis de ambiente (`.env`)

| Variável | Descrição |
|----------|-----------|
| `MONGODB_URI` | Connection string para o PyMongo |
| `MONGODB_DB` | Banco dos dados brutos |
| `MONGODB_RAW_COLLECTION` | Coleção bruta |
| `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` | Credenciais do container Mongo |
| `MONGODB_PORT` | Porta publicada no host |

## Executando o pipeline

Com o MongoDB em execução e o `.env` configurado:

```bash
python run_etl.py
```

Fluxo:

1. Extração na API Radar Meteorológico (Recife)
2. Carga bruta no MongoDB
3. Leitura do MongoDB e transformação em DataFrame
4. Carga transformada na tabela `recife` do arquivo `radar.db`

## Ideias para quem quiser ir além

- Conexão MongoDB **lazy** em `Extract` e `Load`: só conecta quando necessário; o pipeline fecha com `close()` no `finally` de `run_etl.py`.
- Agendar execuções periódicas (cron, Airflow, etc.) para enriquecer o histórico no MongoDB.
- Usar `load_mongo(..., substituir=True)` só em desenvolvimento, quando quiser resetar a coleção.
