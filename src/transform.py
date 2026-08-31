import pandas as pd


class Transform:
    """
    Responsável por transformar os dados extraídos, deixando-os prontos
    para carga em um banco relacional (SQLite).
    """

    def __init__(self):
        pass

    def transform_pnadc(self, data: list[dict]) -> pd.DataFrame:
        """
        Converte o resultado bruto da API do IBGE (agregado 4093) em um
        DataFrame com uma linha por período, pronto para carga no SQLite.

        Atributos:
            data: lista de dicionários no formato retornado pela API do
                IBGE (o mesmo salvo por `Load.load_mongo`)
        """
        serie = data[0]["resultados"][0]["series"][0]["serie"]

        df = pd.DataFrame.from_dict(serie, orient="index", columns=["valor"])
        df.index.name = "periodo"
        df = df.reset_index()

        df["valor"] = df["valor"].replace("...", "0")
        df["valor"] = df["valor"].astype(float)

        df["ano"] = df["periodo"].str[:4]
        df["tri"] = df["periodo"].str[-2:].astype(int)

        df["periodo"] = pd.PeriodIndex(
            df["ano"] + "Q" + df["tri"].astype(str), freq="Q"
        )
        df["periodo"] = df["periodo"].dt.to_timestamp()

        print("Dados transformados com sucesso!")
        return df
