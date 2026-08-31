import os
from typing import Literal

import requests
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()


class Extract:
    """
    Responsável por extrair medições históricas de estações automáticas
    do INMET (portal.inmet.gov.br / apitempo.inmet.gov.br).

    Também relê, de uma coleção do MongoDB, dados já carregados
    anteriormente por `Load.load_mongo`, para alimentar a etapa de
    transformação do pipeline.
    """

    ESTACOES: dict[str, dict[str, str]] = {
        "recife": {
            "cod_estacao": "A301",
            "nome": "RECIFE",
            "uf": "PE",
        },
        "alianca": {
            "cod_estacao": "A388",
            "nome": "ALIANCA",
            "uf": "PE",
        },
        "arco_verde": {
            "cod_estacao": "A309",
            "nome": "ARCO VERDE",
            "uf": "PE",
        },
        "cabrobo": {
            "cod_estacao": "A329",
            "nome": "CABROBO",
            "uf": "PE",
        },
        "floresta": {
            "cod_estacao": "A351",
            "nome": "FLORESTA",
            "uf": "PE",
        },
        "garanhuns": {
            "cod_estacao": "A322",
            "nome": "GARANHUNS",
            "uf": "PE",
        },
        "itapissuma": {
            "cod_estacao": "A389",
            "nome": "ITAPISSUMA",
            "uf": "PE",
        },
        "ouricuri": {
            "cod_estacao": "A366",
            "nome": "OURICURI",
            "uf": "PE",
        },
        "palmares": {
            "cod_estacao": "A357",
            "nome": "PALMARES",
            "uf": "PE",
        },
        "salgueiro": {
            "cod_estacao": "A370",
            "nome": "SALGUEIRO",
            "uf": "PE",
        },
        "santa_cruz_do_capibaribe": {
            "cod_estacao": "A387",
            "nome": "SANTA CRUZ DO CAPIBARIBE",
            "uf": "PE",
        },
        "sao_jose_da_coroa_grande": {
            "cod_estacao": "A390",
            "nome": "SAO JOSE DA COROA GRANDE",
            "uf": "PE",
        },
        "serra_talhada": {
            "cod_estacao": "A350",
            "nome": "SERRA TALHADA",
            "uf": "PE",
        },
        "surubim": {
            "cod_estacao": "A328",
            "nome": "SURUBIM",
            "uf": "PE",
        },
    }

    FREQUENCIAS: dict[str, str] = {
        "H": "Dados horários da estação",
        "D": "Dados diários da estação",
    }

    RADAR_RECIFE_IBGE = "2611606"
    RADAR_RECIFE_URL = "https://radarmeteorologico.com.br/previsao/pe/recife"

    def __init__(self) -> None:
        self.inmet_base_url = "https://apitempo.inmet.gov.br"
        self.radar_base_url = "https://radarmeteorologico.com.br"
        self.request_headers = {
            "User-Agent": "Urbanize-ETL/1.0",
            "Accept": "application/json",
        }
        self.mongo_uri = os.getenv("MONGODB_URI")
        self.client = MongoClient(self.mongo_uri, server_api=ServerApi("1"))

    def close(self) -> None:
        """Encerra a conexão com o MongoDB."""
        self.client.close()

    def inmet(
        self,
        cidade: str,
        data_inicio: str,
        data_fim: str,
        frequencia: Literal["H", "D"] = "D",
    ) -> list[dict]:
        """
        Busca medições históricas reais do INMET para uma cidade
        cadastrada em `Extract.ESTACOES`.

        Atributos:
            cidade: nome da cidade (ver `Extract.ESTACOES`, ex.: "recife")
            data_inicio: início do intervalo, no formato AAAA-MM-DD
            data_fim: fim do intervalo, no formato AAAA-MM-DD
            frequencia: "H" para horários ou "D" para diários
        """
        if cidade not in self.ESTACOES:
            raise ValueError(
                f"Cidade inválida: {cidade}. Opções: {list(self.ESTACOES)}"
            )

        if frequencia not in self.FREQUENCIAS:
            raise ValueError(
                f"Frequência inválida: {frequencia}. Opções: {list(self.FREQUENCIAS)}"
            )

        estacao = self.ESTACOES[cidade]
        cod_estacao = estacao["cod_estacao"]

        dados = self._buscar_medicoes(
            cod_estacao=cod_estacao,
            data_inicio=data_inicio,
            data_fim=data_fim,
            frequencia=frequencia,
        )
        if dados:
            print(
                f"Dados extraídos com sucesso da API do INMET "
                f"(estação {cod_estacao}, {cidade}, {frequencia})!"
            )
            return dados

        frequencia_alternativa: Literal["H", "D"] = "H" if frequencia == "D" else "D"
        print(
            f"Sem medições {frequencia} para {cidade}. "
            f"Tentando frequência {frequencia_alternativa}..."
        )
        dados = self._buscar_medicoes(
            cod_estacao=cod_estacao,
            data_inicio=data_inicio,
            data_fim=data_fim,
            frequencia=frequencia_alternativa,
        )
        if dados:
            print(
                f"Dados extraídos com sucesso da API do INMET "
                f"(estação {cod_estacao}, {cidade}, {frequencia_alternativa})!"
            )
            return dados

        if cidade == "recife":
            print(
                "API do INMET indisponível para Recife. "
                "Buscando dados no RadarMeteorológico..."
            )
            return self._buscar_radar_recife(estacao)

        raise ValueError(
            f"Nenhuma medição histórica encontrada para {cidade} "
            f"(estação {cod_estacao}) entre {data_inicio} e {data_fim}. "
            "A API do INMET aceita intervalos de até 6 meses por consulta."
        )

    def _buscar_medicoes(
        self,
        cod_estacao: str,
        data_inicio: str,
        data_fim: str,
        frequencia: Literal["H", "D"],
    ) -> list[dict]:
        """
        Consulta a API de estações do INMET para um intervalo e frequência.

        Atributos:
            cod_estacao: código da estação (ex.: "A301")
            data_inicio: início do intervalo, no formato AAAA-MM-DD
            data_fim: fim do intervalo, no formato AAAA-MM-DD
            frequencia: "H" para horários ou "D" para diários
        """
        freq_path = "" if frequencia == "H" else "diaria/"
        url = (
            f"{self.inmet_base_url}/estacao/{freq_path}"
            f"{data_inicio}/{data_fim}/{cod_estacao}"
        )

        response = requests.get(url, headers=self.request_headers, timeout=30)

        if response.status_code in (204, 404):
            return []

        response.raise_for_status()

        if not response.text:
            return []

        return response.json()

    def _buscar_radar_recife(self, estacao: dict[str, str]) -> list[dict]:
        """
        Obtém dados meteorológicos de Recife na API pública do
        RadarMeteorológico (reserva quando o INMET falha).

        Referência: https://radarmeteorologico.com.br/previsao/pe/recife

        Atributos:
            estacao: metadados da estação de Recife (ver `Extract.ESTACOES`)
        """
        cidade_url = (
            f"{self.radar_base_url}/api/v1/cidades"
            f"?ibge={self.RADAR_RECIFE_IBGE}"
        )
        response_cidade = requests.get(
            cidade_url, headers=self.request_headers, timeout=30
        )
        response_cidade.raise_for_status()

        payload_cidade = response_cidade.json()
        if not payload_cidade.get("cidades"):
            raise ValueError(
                "Recife não encontrado na API do RadarMeteorológico."
            )

        temperatura_url = f"{self.radar_base_url}/api/v1/temperaturas?limite=107"
        response_temp = requests.get(
            temperatura_url, headers=self.request_headers, timeout=30
        )
        response_temp.raise_for_status()

        payload_temp = response_temp.json()
        registros_temp = payload_temp.get("mais_quentes", []) + payload_temp.get(
            "mais_frias", []
        )
        recife = next(
            (
                item
                for item in registros_temp
                if str(item.get("ibge")) == self.RADAR_RECIFE_IBGE
            ),
            None,
        )
        if recife is None:
            raise ValueError(
                "Recife não retornou dados em /api/v1/temperaturas "
                "do RadarMeteorológico."
            )

        cidade_info = payload_cidade["cidades"][0]
        registro = {
            "CD_ESTACAO": estacao["cod_estacao"],
            "DC_NOME": estacao["nome"],
            "SG_ESTADO": estacao["uf"],
            "DT_MEDICAO": payload_temp.get("atualizado_em"),
            "TEMP_INS": recife.get("temperatura"),
            "TEMP_MAX": recife.get("maxima"),
            "TEMP_MIN": recife.get("minima"),
            "CHUVA": recife.get("chuva_mm"),
            "CONDICAO": recife.get("condicao"),
            "CODIGO_WMO": recife.get("codigo_wmo"),
            "LATITUDE": cidade_info.get("latitude"),
            "LONGITUDE": cidade_info.get("longitude"),
            "FONTE": "radarmeteorologico",
            "URL": self.RADAR_RECIFE_URL,
        }

        print(
            "Dados extraídos com sucesso do RadarMeteorológico "
            f"({self.RADAR_RECIFE_URL})!"
        )
        return [registro]

    def extract_collection_from_mongo(
        self, db_name: str, collection_name: str
    ) -> list[dict]:
        """
        Busca todos os documentos de uma coleção do MongoDB.

        Atributos:
            db_name: nome do banco de dados no MongoDB
            collection_name: nome da coleção a ser lida
        """
        collection = self.client[db_name][collection_name]
        documentos = list(collection.find())

        print(f"Dados lidos com sucesso da coleção '{collection_name}'!")
        return documentos
