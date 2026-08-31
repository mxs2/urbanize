# Projeto de Engenharia de Dados - ETL

Pipeline de ETL que extrai dados meteorológicos do INMET (Recife) a partir da API oficial, carrega o resultado bruto em uma coleção MongoDB, transforma esses dados com pandas e carrega o resultado final em uma tabela SQLite (com opção de salvar o bruto em arquivo JSON local).

## Estrutura do projeto

```
src/
  extract.py    # Extract: busca dados do INMET (inmet() para Recife) e relê dados já carregados no MongoDB
  transform.py  # Transform: transforma os dados brutos do INMET em um DataFrame pronto para o SQLite
  load.py       # Load: salva em JSON local (load_json), no MongoDB (load_mongo) ou em SQLite (load_sqlite)
run_etl.py      # ponto de entrada do pipeline (Extract -> Load -> Extract -> Transform -> Load), em main()
jsons/          # saídas de exemplo em JSON
```

### `Extract`

- `inmet(cidade, data_inicio, data_fim, frequencia="D")`: busca **medições históricas** da estação automática da cidade na API do INMET (`apitempo.inmet.gov.br`). Se a frequência pedida não retornar dados, tenta a outra (horária/diária). Para **Recife**, se o INMET falhar, usa a [API pública do RadarMeteorológico](https://radarmeteorologico.com.br/api-publica) como reserva (`/api/v1/cidades` + `/api/v1/temperaturas`).
- `extract_collection_from_mongo(db_name, collection_name)`: relê todos os documentos de uma coleção do MongoDB (por exemplo, a que `Load.load_mongo` acabou de popular), para alimentar a etapa de transformação.
- `Extract.ESTACOES` e `Extract.FREQUENCIAS`: dicionários com as cidades e frequências válidas. Parâmetros inválidos geram `ValueError`.
- `Extract.ESTACOES` inclui 14 cidades de Pernambuco com estações operantes; o pipeline padrão usa `recife` (estação `A301`).
- URLs e cabeçalhos HTTP ficam no `__init__`; a conexão com o MongoDB é encerrada com `close()`.

### `Transform`

- `transform_inmet(data)`: recebe a lista de dicionários retornada pela API do INMET (a mesma salva no MongoDB) e devolve um `DataFrame` limpo, pronto para carga no SQLite.

### `Load`

- `load_json(nome_arquivo, data)`: salva os dados extraídos em `jsons/<nome_arquivo>.json`.
- `load_mongo(data, db_name, collection_name)`: insere o resultado bruto na coleção informada e fecha a conexão com o MongoDB (`close()`) logo em seguida.
- `load_sqlite(df, nome_banco="inmet.db", nome_tabela="recife")`: salva o DataFrame transformado em uma tabela SQLite local.
- A conexão com o MongoDB (`self.client`) é criada uma única vez, no `__init__` da classe.

## Configuração do Ambiente

### Windows

Criação do venv
```bash
python -m venv .venv
```

Ativação do venv
```bash
.venv\Scripts\activate
```

### Linux/Mac

Criação do venv
```bash
python3 -m venv .venv
```

Ativação do venv
```bash
source .venv/bin/activate
```

### Dependências

```bash
pip install -r requirements.txt
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com a string de conexão do MongoDB:

```
MONGODB_URI=<sua_connection_string>
```

## Executando o pipeline

```bash
python run_etl.py
```

O pipeline roda em três etapas:

1. Extrai medições históricas do INMET para Recife e insere o resultado bruto na coleção `RECIFE` do banco `INMET` no MongoDB configurado.
2. Relê esses mesmos dados do MongoDB e os transforma em um DataFrame (uma linha por medição).
3. Salva o DataFrame transformado na tabela `recife` do banco SQLite local `inmet.db` (arquivo gerado na raiz do projeto, não versionado).

> A API de estações do INMET limita cada consulta a, no máximo, **6 meses**. Se nenhuma medição for retornada e a cidade for **Recife**, o pipeline consulta o [RadarMeteorológico](https://radarmeteorologico.com.br/previsao/pe/recife) como reserva. Demais cidades interrompem com erro.

## Ideias para quem quiser ir além

Este projeto foi pensado como material de estudo, priorizando simplicidade. Um ponto que dá margem para explorar conceitos mais avançados de POO é o gerenciamento das conexões com o MongoDB em `Load` e `Extract`:

- Hoje o `MongoClient` é criado uma única vez no `__init__` e fechado ao final de `load_mongo`. Isso funciona bem quando `load_mongo` é chamado uma única vez por execução (como em `run_etl.py`).
- Se `load_mongo` precisasse ser chamado várias vezes na mesma execução (por exemplo, para inserir em coleções diferentes), a conexão seria reaberta e fechada a cada chamada. Uma otimização possível é criar a conexão de forma "preguiçosa" (lazy), reaproveitando-a entre chamadas e deixando o encerramento por conta de quem orquestra o pipeline.

Fica como desafio para quem quiser se aprofundar em gerenciamento de recursos e ciclo de vida de objetos em Python.
