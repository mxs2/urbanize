import pandas as pd


class Transform:
    """
    Responsável por transformar medições históricas do INMET, deixando-as
    prontas para carga em um banco relacional (SQLite).
    """

    COLUNAS_NUMERICAS = [
        "TEMP_MED",
        "TEMP_MAX",
        "TEMP_MIN",
        "UMID_MED",
        "CHUVA",
        "TEMP_INS",
        "UMID_INS",
        "HR_MEDICAO",
        "VENT_VEL",
        "CODIGO_WMO",
        "LATITUDE",
        "LONGITUDE",
    ]

    def __init__(self) -> None:
        pass

    def transform_inmet(self, data: list[dict]) -> pd.DataFrame:
        """
        Converte medições brutas da API do INMET em um DataFrame limpo,
        pronto para carga no SQLite.

        Atributos:
            data: lista de dicionários retornada pela extração (a mesma
                salva por `Load.load_mongo`)
        """
        df = pd.DataFrame(data)
        df = df.drop(columns=["_id"], errors="ignore")

        if "DT_MEDICAO" in df.columns:
            df["DT_MEDICAO"] = pd.to_datetime(
                df["DT_MEDICAO"], format="ISO8601", errors="coerce"
            )

        for coluna in self.COLUNAS_NUMERICAS:
            if coluna in df.columns:
                df[coluna] = (
                    df[coluna]
                    .replace("", pd.NA)
                    .replace("...", pd.NA)
                    .astype(float)
                )

        colunas_ordenadas = [
            col
            for col in [
                "CD_ESTACAO",
                "DC_NOME",
                "SG_ESTADO",
                "DT_MEDICAO",
                "HR_MEDICAO",
                "TEMP_MED",
                "TEMP_MAX",
                "TEMP_MIN",
                "TEMP_INS",
                "UMID_MED",
                "UMID_INS",
                "CHUVA",
                "VENT_VEL",
                "PRESS_INS",
                "CONDICAO",
                "CODIGO_WMO",
                "LATITUDE",
                "LONGITUDE",
                "FONTE",
                "URL",
            ]
            if col in df.columns
        ]
        df = df[colunas_ordenadas + [c for c in df.columns if c not in colunas_ordenadas]]

        if "DT_MEDICAO" in df.columns:
            sort_cols = ["DT_MEDICAO"]
            if "HR_MEDICAO" in df.columns:
                sort_cols.append("HR_MEDICAO")
            df = df.sort_values(sort_cols, na_position="last")

        print("Dados transformados com sucesso!")
        return df.reset_index(drop=True)
