from src.extract import Extract
from src.load import Load
from src.transform import Transform


def main():
    ext = Extract()
    ld = Load()
    transformer = Transform()

    print("Etapa 1: Extração da API!")
    data = ext.pnadc(variavel=4099, estado=26)
    ld.load_mongo(data, "IBGE", "PNADC")

    print("Etapa 2: Transformando os dados!")
    data = ext.extract_collection_from_mongo("IBGE", "PNADC")
    df = transformer.transform_pnadc(data)

    print("Etapa 3: Salvando no SQLite!")
    ld.load_sqlite(df=df)

    ext.close()


if __name__ == "__main__":
    main()
