import pandas as pd
from prefect import flow, get_run_logger, task

import src.config as config
from src.extract import Extract
from src.load import Load
from src.transform import Transform

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
def transform(db_name: str, collection_name: str) -> pd.DataFrame:
    logger = get_run_logger()
    extractor = Extract()
    transformer = Transform()
    data = extractor.extract_latest_from_mongo(db_name, collection_name)
    extractor.close()
    df = transformer.transform_radar(data)
    logger.info(
        f"{len(df)} linha(s) transformada(s) a partir de {len(data)} documento(s) "
        f"da carga mais recente em {db_name}.{collection_name}"
    )
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
    db_name: str = config.MONGODB_DB,
    collection_name: str = config.MONGODB_RAW_COLLECTION,
):

    data = extract()
    load_data(data, db_name, collection_name)
    df = transform(db_name, collection_name)
    load_sqlite(df, "recife")
    load_neon(df, "recife")


if __name__ == "__main__":
    etl_radar_flow()
