import os

from dotenv import load_dotenv

from src.extract import Extract
from src.load import Load
from src.transform import Transform

load_dotenv()

MONGODB_DB = os.getenv("MONGODB_DB", "urbanize_etl")
MONGODB_RAW_COLLECTION = os.getenv("MONGODB_RAW_COLLECTION", "radar_recife_raw")


def main() -> None:
    ext = Extract()
    ld = Load()
    transformer = Transform()

    try:
        print("Etapa 1: Extração — API Radar Meteorológico (Recife)")
        data = ext.extract_radar_recife()

        print("Etapa 2: Carga bruta — MongoDB")
        ld.load_mongo(data, MONGODB_DB, MONGODB_RAW_COLLECTION)

        print("Etapa 3: Leitura do MongoDB e transformação")
        raw_from_mongo = ext.extract_collection_from_mongo(
            MONGODB_DB, MONGODB_RAW_COLLECTION
        )
        df = transformer.transform_radar(raw_from_mongo)
        print(df)

        print("Etapa 4: Carga transformada — SQLite")
        ld.load_sqlite(df=df, nome_banco="radar.db", nome_tabela="recife")
    finally:
        ext.close()
        ld.close()


if __name__ == "__main__":
    main()
