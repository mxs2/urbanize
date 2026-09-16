import os
import sys

from dotenv import load_dotenv

from src.extract import Extract
from src.load import Load
from src.transform import Transform

for _stream in (sys.stdout, sys.stderr):
    if _stream is not None and hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (OSError, ValueError):
            pass

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

        print("Etapa 3: Documentos pendentes (MongoDB → SQLite)")
        persistidos = ld.sqlite_mongo_ids(
            nome_banco="database/radar.db", nome_tabela="recife"
        )
        pending = ext.extract_pending_from_mongo(
            MONGODB_DB, MONGODB_RAW_COLLECTION, persistidos
        )

        if not pending:
            print("SQLite já está em dia com o MongoDB; nada a transformar.")
        else:
            print("Etapa 4: Transformação (somente pendentes)")
            df = transformer.transform_radar(pending)
            print(df)

            print("Etapa 5: Carga incremental — SQLite")
            ld.load_sqlite(df=df, nome_banco="database/radar.db", nome_tabela="recife")

            print("Etapa 6: Carga incremental — NeonDB")
            ld.load_neon(df=df, nome_tabela="recife")
    finally:
        ext.close()
        ld.close()


if __name__ == "__main__":
    main()
