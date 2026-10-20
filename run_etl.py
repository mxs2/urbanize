import sys

import src.config as config
from src.extract import Extract
from src.load import Load
from src.transform import Transform

for _stream in (sys.stdout, sys.stderr):
    if _stream is not None and hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (OSError, ValueError):
            pass

MONGODB_DB = config.MONGODB_DB
MONGODB_RAW_COLLECTION = config.MONGODB_RAW_COLLECTION


def main() -> None:
    ext = Extract()
    ld = Load()
    transformer = Transform()

    try:
        print("Etapa 1: Extração — API Radar Meteorológico (Recife)")
        data = ext.extract_radar_recife()

        print("Etapa 2: Carga bruta — MongoDB")
        ld.load_mongo(data, MONGODB_DB, MONGODB_RAW_COLLECTION)

        print("Etapa 3: Transformação (somente a carga mais recente)")
        latest = ext.extract_latest_from_mongo(MONGODB_DB, MONGODB_RAW_COLLECTION)
        df = transformer.transform_radar(latest)
        print(df)

        print("Etapa 4: Carga incremental — SQLite")
        ld.load_sqlite(df=df, nome_banco="database/radar.db", nome_tabela="recife")

        print("Etapa 5: Carga incremental — NeonDB")
        ld.load_neon(df=df, nome_tabela="recife")
    finally:
        ext.close()
        ld.close()


if __name__ == "__main__":
    main()
