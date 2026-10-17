import os

import pandas as pd
from dotenv import load_dotenv
from prefect import flow, get_run_logger, task

from src.extract import Extract
from src.load import Load
from src.transform import Transform

load_dotenv()

MONGODB_DB = os.getenv("MONGODB_DB", "urbanize_etl")
MONGODB_RAW_COLLECTION = os.getenv("MONGODB_RAW_COLLECTION", "radar_recife_raw")
SQLITE_DB = "database/radar.db"


@task(retries=3, retry_delay_seconds=10)
def extract() -> list[dict]:
    logger = get_run_logger()
    extractor = Extract()
    data = extractor.extract_radar_recife()
    logger.info(f"{len(data)} registro(s) extraído(s) da API Radar Meteorológico")
    return data


@task
def load_data(data: list[dict], db_name: str, collection_name: str):
    logger = get_run_logger()
    loader = Load()
    loader.load_mongo(data, db_name, collection_name)
    loader.close()
    logger.info(f"{len(data)} registro(s) inserido(s) em {db_name}.{collection_name}")


@task
def extract_pending(db_name: str, collection_name: str, nome_tabela: str) -> list[dict]:
    logger = get_run_logger()
    extractor = Extract()
    loader = Load()
    persistidos = loader.sqlite_mongo_ids(nome_banco=SQLITE_DB, nome_tabela=nome_tabela)
    data = extractor.extract_pending_from_mongo(db_name, collection_name, persistidos)
    extractor.close()
    logger.info(f"{len(data)} documento(s) pendente(s) em {db_name}.{collection_name}")
    return data


@task
def transform(data: list[dict]) -> pd.DataFrame:
    logger = get_run_logger()
    transformer = Transform()
    df = transformer.transform_radar(data)
    logger.info(f"{len(df)} linha(s) transformada(s)")
    return df


@task
def load_sqlite(df: pd.DataFrame, nome_tabela: str):
    logger = get_run_logger()
    ld = Load()
    ld.load_sqlite(df=df, nome_banco=SQLITE_DB, nome_tabela=nome_tabela)
    logger.info(f"{len(df)} linha(s) salva(s) na tabela {nome_tabela} do SQLite")


@task(retries=3, retry_delay_seconds=10)
def load_neon(df: pd.DataFrame, nome_tabela: str):
    logger = get_run_logger()
    ld = Load()
    ld.load_neon(df, nome_tabela)
    logger.info(f"{len(df)} linha(s) salva(s) na tabela {nome_tabela} do Neon")


@flow(name="ETL Radar Recife Prefect", retries=3, log_prints=True)
def etl_radar_flow(
    db_name: str = MONGODB_DB, collection_name: str = MONGODB_RAW_COLLECTION
):

    data = extract()
    load_data(data, db_name, collection_name)
    pending = extract_pending(db_name, collection_name, "recife")
    if not pending:
        print("SQLite já está em dia com o MongoDB; nada a transformar.")
        return
    df = transform(pending)
    load_sqlite(df, "recife")
    load_neon(df, "recife")


if __name__ == "__main__":
    etl_radar_flow()
