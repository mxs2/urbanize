# Projeto de Engenharia de Dados - ETL

Pipeline de ETL que extrai dados da PNAD Contínua a partir da API do IBGE, carrega o resultado bruto em uma coleção MongoDB, transforma esses dados com pandas e carrega o resultado final em uma tabela SQLite (com opção de salvar o bruto em arquivo JSON local).

## Estrutura do projeto

```
src/
  extract.py    # Extract: busca dados de agregados do IBGE (agregado() é genérico; pnadc() é um atalho para o agregado 4093) e relê dados já carregados no MongoDB
  transform.py  # Transform: transforma os dados brutos da PNADC em um DataFrame pronto para o SQLite
  load.py       # Load: salva em JSON local (load_json), no MongoDB (load_mongo) ou em SQLite (load_sqlite)
run_etl.py      # ponto de entrada do pipeline (Extract -> Load -> Extract -> Transform -> Load), em main()
jsons/          # saídas de exemplo em JSON
```

### `Extract`

- `agregado(agregado_id, variavel, estado, periodo_inicio, periodo_fim, classificacao="2[all]")`: método genérico, reutilizável para qualquer agregado (tabela) do IBGE.
- `pnadc(variavel, estado, periodo_inicio="201201", periodo_fim="202602")`: atalho já configurado para o agregado 4093 (PNAD Contínua). O período tem 2012-01 a 2026-02 como padrão, mas pode ser sobrescrito na chamada.
- `extract_collection_from_mongo(db_name, collection_name)`: relê todos os documentos de uma coleção do MongoDB (por exemplo, a que `Load.load_mongo` acabou de popular), para alimentar a etapa de transformação.
- `Extract.UFS` e `Extract.VARIAVEIS_PNADC`: dicionários com os códigos válidos de UF e de variável do agregado 4093. `estado` e `variavel` são validados contra esses dicionários — um código inválido gera `ValueError`.
- A conexão com o MongoDB (`self.client`) é criada uma única vez, no `__init__`, e encerrada com `close()`.

### `Transform`

- `transform_pnadc(data)`: recebe a lista de dicionários no formato retornado pela API do IBGE (a mesma salva no MongoDB) e devolve um `DataFrame` com uma linha por período (data, valor), pronto para carga no SQLite.

### `Load`

- `load_json(nome_arquivo, data)`: salva os dados extraídos em `jsons/<nome_arquivo>.json`.
- `load_mongo(data, db_name, collection_name)`: insere os dados na coleção informada e fecha a conexão com o MongoDB (`close()`) logo em seguida.
- `load_sqlite(df, nome_banco="ibge.db", nome_tabela="pnadc")`: salva um `DataFrame` (já transformado) em uma tabela de um banco SQLite local.
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

1. Extrai os dados da PNADC via API do IBGE e insere o resultado bruto na coleção `PNADC` do banco `IBGE` no MongoDB configurado.
2. Relê esses mesmos dados do MongoDB e os transforma em um DataFrame (uma linha por período).
3. Salva o DataFrame transformado na tabela `pnadc` do banco SQLite local `ibge.db` (arquivo gerado na raiz do projeto, não versionado).

## Ideias para quem quiser ir além

Este projeto foi pensado como material de estudo, priorizando simplicidade. Um ponto que dá margem para explorar conceitos mais avançados de POO é o gerenciamento das conexões com o MongoDB em `Load` e `Extract`:

- Hoje o `MongoClient` é criado uma única vez no `__init__` e fechado ao final de `load_mongo`. Isso funciona bem quando `load_mongo` é chamado uma única vez por execução (como em `run_etl.py`).
- Se `load_mongo` precisasse ser chamado várias vezes na mesma execução (por exemplo, para inserir em coleções diferentes), a conexão seria reaberta e fechada a cada chamada. Uma otimização possível é criar a conexão de forma "preguiçosa" (lazy), reaproveitando-a entre chamadas e deixando o encerramento por conta de quem orquestra o pipeline.

Fica como desafio para quem quiser se aprofundar em gerenciamento de recursos e ciclo de vida de objetos em Python.