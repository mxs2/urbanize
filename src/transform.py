import pandas as pd


class Transform:
    """
    Tratamento e limpeza dos dados brutos do Radar Meteorológico,
    produzindo um pandas.DataFrame pronto para persistência (SQLite e NeonDB).
    """

    # Formas de "sem dado" tratadas como nulo. Na API do Radar o ausente vem
    # como `null` no JSON (já vira NaN no pandas); as strings cobrem respostas
    # fora do padrão sem que virem zero, que é um valor real (0 mm de chuva,
    # código WMO 0 = céu limpo).
    MARCADORES_AUSENTE = ["", "-", "--", "N/A", "n/a", "...", "null", "None"]

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
        "data_extracao",
    ]

    def transform_radar(self, data: list[dict]) -> pd.DataFrame:
        """
        Converte a lista de documentos brutos (API ou MongoDB) em DataFrame limpo.

        Atributos:
            data: documentos da carga mais recente
                (`Extract.extract_latest_from_mongo`); cada documento vira
                exatamente uma linha do DataFrame
        """
        if not data:
            raise ValueError("Nenhum documento para transformar.")

        df = pd.DataFrame(data)
        if "_id" in df.columns:
            df["mongo_id"] = df["_id"].astype(str)
        df = df.drop(
            columns=["_id", "_api_cidade", "_api_temperaturas_meta"], errors="ignore"
        )

        df = df.replace(self.MARCADORES_AUSENTE, None)

        if "atualizado_em" in df.columns:
            df["atualizado_em"] = pd.to_datetime(
                df["atualizado_em"], format="ISO8601", utc=True
            )
        if "data_extracao" in df.columns:
            df["data_extracao"] = pd.to_datetime(df["data_extracao"], utc=True)

        # Sem errors="coerce": um valor inesperado (ex.: "trinta") faz a
        # transformação falhar em vez de virar nulo sem ninguém perceber.
        for coluna in self.COLUNAS_NUMERICAS:
            if coluna in df.columns:
                df[coluna] = pd.to_numeric(df[coluna]).astype(float)

        if "ibge" in df.columns:
            df["ibge"] = df["ibge"].astype("Int64")

        colunas_presentes = [c for c in self.COLUNAS_ORDEM if c in df.columns]
        restantes = [c for c in df.columns if c not in colunas_presentes]
        df = df[colunas_presentes + restantes]

        sort_cols = [c for c in ("data_extracao", "atualizado_em") if c in df.columns]
        if sort_cols:
            df = df.sort_values(
                sort_cols, ascending=[False] * len(sort_cols), na_position="last"
            )

        print("Dados transformados com sucesso!")
        return df.reset_index(drop=True)
