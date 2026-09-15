import os
from typing import Any

import requests
from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()


class Extract:
    """
    Extração de dados da API pública do Radar Meteorológico
    (https://radarmeteorologico.com.br).

    Métodos dedicados por endpoint; o método `extract_radar_recife` monta o
    payload bruto usado na carga no MongoDB e na transformação.
    """

    RADAR_BASE_URL = "https://radarmeteorologico.com.br"
    RADAR_RECIFE_IBGE = "2611606"
    RADAR_RECIFE_URL = f"{RADAR_BASE_URL}/previsao/pe/recife"

    ENDPOINT_CIDADES = "/api/v1/cidades"
    ENDPOINT_TEMPERATURAS = "/api/v1/temperaturas"

    def __init__(self) -> None:
        self.request_headers = {
            "User-Agent": "Urbanize-ETL/1.0",
            "Accept": "application/json",
        }
        self.mongo_uri = os.getenv("MONGODB_URI")
        self._mongo_client: MongoClient | None = None

    @property
    def mongo_client(self) -> MongoClient:
        if self._mongo_client is None:
            if not self.mongo_uri:
                raise ValueError(
                    "MONGODB_URI não definida. Copie .env.example para .env "
                    "e suba o MongoDB com: docker compose up -d"
                )
            self._mongo_client = MongoClient(
                self.mongo_uri, server_api=ServerApi("1")
            )
        return self._mongo_client

    def close(self) -> None:
        """Encerra a conexão com o MongoDB, se aberta."""
        if self._mongo_client is not None:
            self._mongo_client.close()
            self._mongo_client = None

    def _get_json(self, path: str, params: dict[str, Any] | None = None) -> dict:
        url = f"{self.RADAR_BASE_URL}{path}"
        response = requests.get(
            url, params=params, headers=self.request_headers, timeout=30
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError(f"Resposta inesperada de {path}: tipo {type(payload)}")
        return payload

    def fetch_cidade_por_ibge(self, ibge: str) -> dict[str, Any]:
        """
        GET /api/v1/cidades?ibge=<codigo>

        Retorna metadados da cidade (coordenadas, nome, etc.).
        """
        payload = self._get_json(self.ENDPOINT_CIDADES, params={"ibge": ibge})
        cidades = payload.get("cidades") or []
        if not cidades:
            raise ValueError(f"Cidade IBGE {ibge} não encontrada na API.")
        return cidades[0]

    def fetch_temperaturas(self, limite: int = 107) -> dict[str, Any]:
        """
        GET /api/v1/temperaturas?limite=<n>

        Retorna ranking de temperaturas e timestamp de atualização.
        """
        return self._get_json(
            self.ENDPOINT_TEMPERATURAS, params={"limite": limite}
        )

    def _temperatura_por_ibge(
        self, payload_temperaturas: dict[str, Any], ibge: str
    ) -> dict[str, Any]:
        registros = (payload_temperaturas.get("mais_quentes") or []) + (
            payload_temperaturas.get("mais_frias") or []
        )
        for item in registros:
            if str(item.get("ibge")) == ibge:
                return item
        raise ValueError(
            f"IBGE {ibge} ausente em {self.ENDPOINT_TEMPERATURAS}."
        )

    def extract_radar_recife(self) -> list[dict[str, Any]]:
        """
        Orquestra as consultas necessárias e devolve documentos brutos
        (lista com um registro consolidado para Recife).
        """
        cidade = self.fetch_cidade_por_ibge(self.RADAR_RECIFE_IBGE)
        temperaturas = self.fetch_temperaturas()
        recife = self._temperatura_por_ibge(temperaturas, self.RADAR_RECIFE_IBGE)

        registro = {
            "ibge": self.RADAR_RECIFE_IBGE,
            "nome": cidade.get("nome") or "Recife",
            "uf": cidade.get("uf") or "PE",
            "latitude": cidade.get("latitude"),
            "longitude": cidade.get("longitude"),
            "atualizado_em": temperaturas.get("atualizado_em"),
            "temperatura": recife.get("temperatura"),
            "temperatura_maxima": recife.get("maxima"),
            "temperatura_minima": recife.get("minima"),
            "chuva_mm": recife.get("chuva_mm"),
            "condicao": recife.get("condicao"),
            "codigo_wmo": recife.get("codigo_wmo"),
            "fonte": "radarmeteorologico",
            "url_previsao": self.RADAR_RECIFE_URL,
            "_api_cidade": cidade,
            "_api_temperaturas_meta": {
                "fonte": temperaturas.get("fonte"),
                "atribuicao": temperaturas.get("atribuicao"),
                "cidades_monitoradas": temperaturas.get("cidades_monitoradas"),
            },
        }

        print(
            "Dados extraídos com sucesso do Radar Meteorológico "
            f"({self.RADAR_RECIFE_URL})!"
        )
        return [registro]

    def extract_collection_from_mongo(
        self, db_name: str, collection_name: str
    ) -> list[dict]:
        """
        Lê todos os documentos de uma coleção do MongoDB (dados brutos já carregados).
        """
        collection = self.mongo_client[db_name][collection_name]
        documentos = list(collection.find())
        print(
            f"Dados lidos com sucesso da coleção '{collection_name}' "
            f"(banco '{db_name}')!"
        )
        return documentos

    def extract_pending_from_mongo(
        self,
        db_name: str,
        collection_name: str,
        persisted_mongo_ids: set[str],
    ) -> list[dict]:
        """
        Lê documentos da coleção que ainda não foram persistidos no SQLite.

        Usa o `_id` do MongoDB (como string em `mongo_id` no SQLite) para
        evitar reprocessar todo o histórico a cada execução.
        """
        collection = self.mongo_client[db_name][collection_name]
        if persisted_mongo_ids:
            object_ids = [ObjectId(mongo_id) for mongo_id in persisted_mongo_ids]
            filtro: dict[str, Any] = {"_id": {"$nin": object_ids}}
        else:
            filtro = {}

        documentos = list(collection.find(filtro))
        print(
            f"{len(documentos)} documento(s) pendente(s) na coleção "
            f"'{collection_name}' (banco '{db_name}')."
        )
        return documentos
