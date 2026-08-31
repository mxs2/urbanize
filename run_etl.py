from src.extract import Extract
from src.load import Load
from src.transform import Transform


def main():
    ext = Extract()
    ld = Load()
    transformer = Transform()

    print("Etapa 1: Extração da API do INMET (Recife)!")
    data = ext.inmet(
        cidade="recife",
        data_inicio="2026-06-01",
        data_fim="2026-08-31",
        frequencia="H",
    )
    ld.load_mongo(data, "INMET", "RECIFE")

    print("Etapa 2: Transformando os dados!")
    data = ext.extract_collection_from_mongo("INMET", "RECIFE")
    df = transformer.transform_inmet(data)

    print("Etapa 3: Salvando no SQLite!")
    ld.load_sqlite(df=df, nome_banco="inmet.db", nome_tabela="recife")

    ext.close()


if __name__ == "__main__":
    main()
