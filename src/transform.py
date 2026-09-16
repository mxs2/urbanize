import pandas as pd


class Transform:
    """
    Tratamento e limpeza dos dados brutos do Radar Meteorológico,
    produzindo um pandas.DataFrame pronto para persistência (SQLite).
    """

    COLUNAS_NUMERICAS = [
        "ibge",
        "latitude",
        "longitude",
        "temperatura",
        "temperatura_maxima",
        "temperatura_minima",
        "chuva_mm",
        "codigo_wmo",
    ]

    COLUNAS_ORDEM = [
        "mongo_id",
        "ibge",
        "nome",
        "uf",
        "atualizado_em",
        "temperatura",
        "temperatura_maxima",
        "temperatura_minima",
        "chuva_mm",
        "condicao",
        "codigo_wmo",
        "latitude",
        "longitude",
        "fonte",
        "url_previsao",
        "ingested_at",
    ]

    def transform_radar(self, data: list[dict]) -> pd.DataFrame:
        """
        Converte a lista de documentos brutos (API ou MongoDB) em DataFrame limpo.

        Atributos:
            data: lista retornada por `Extract.extract_radar_recife` ou
                `Extract.extract_collection_from_mongo`
        """
        if not data:
            raise ValueError("Nenhum documento para transformar.")

        df = pd.DataFrame(data)
        if "_id" in df.columns:
            df["mongo_id"] = df["_id"].astype(str)
        df = df.drop(
            columns=["_id", "_api_cidade", "_api_temperaturas_meta"], errors="ignore"
        )

        for col_data in ("atualizado_em", "ingested_at"):
            if col_data in df.columns:
                df[col_data] = pd.to_datetime(
                    df[col_data], format="ISO8601", errors="coerce"
                )

        for coluna in self.COLUNAS_NUMERICAS:
            if coluna in df.columns:
                df[coluna] = (
                    df[coluna].replace("", pd.NA).replace("...", pd.NA).astype(float)
                )

        if "ibge" in df.columns:
            df["ibge"] = df["ibge"].astype("Int64")

        colunas_presentes = [c for c in self.COLUNAS_ORDEM if c in df.columns]
        restantes = [c for c in df.columns if c not in colunas_presentes]
        df = df[colunas_presentes + restantes]

        sort_cols = [c for c in ("ingested_at", "atualizado_em") if c in df.columns]
        if sort_cols:
            df = df.sort_values(
                sort_cols, ascending=[False] * len(sort_cols), na_position="last"
            )

        print("Dados transformados com sucesso!")
        return df.reset_index(drop=True)
