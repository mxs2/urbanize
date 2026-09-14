import os
import sqlite3
from datetime import datetime, timezone

import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()


class Load:
    """
    Persistência do pipeline: dados brutos no MongoDB e dados transformados no SQLite.
    """

    def __init__(self) -> None:
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

    def load_json(self, nome_arquivo: str, data: list[dict]) -> None:
        """
        Salva o resultado da extração em um arquivo JSON local, em jsons/.
        """
        os.makedirs("jsons", exist_ok=True)
        with open(f"jsons/{nome_arquivo}.json", "w", encoding="UTF-8") as f:
            f.write(str(data))

        print(f"Dados salvos com sucesso em 'jsons/{nome_arquivo}.json'!")

    def load_mongo(
        self,
        data: list[dict],
        db_name: str,
        collection_name: str,
        *,
        substituir: bool = False,
    ) -> None:
        """
        Insere o resultado bruto da extração em uma coleção do MongoDB.

        Usa a variável de ambiente MONGODB_URI (arquivo .env na raiz do projeto).

        Por padrão faz **append** (histórico): cada execução adiciona novos
        documentos com `ingested_at`. Use `substituir=True` apenas para limpar
        a coleção antes de inserir.

        Atributos:
            data: documentos retornados pela API
            db_name: nome do banco MongoDB
            collection_name: nome da coleção
            substituir: se True, remove documentos anteriores antes de inserir
        """
        if not data:
            print(f"Nenhum documento para inserir em '{collection_name}'.")
            return

        collection = self.mongo_client[db_name][collection_name]

        if substituir:
            collection.delete_many({})
            print(f"Coleção '{collection_name}' esvaziada (substituir=True).")

        collection.create_index([("ibge", 1), ("ingested_at", -1)])
        collection.create_index([("atualizado_em", -1)])

        ingested_at = datetime.now(timezone.utc)
        documentos = [
            {**doc, "ingested_at": ingested_at.isoformat()} for doc in data
        ]
        collection.insert_many(documentos)

        total = collection.count_documents({})
        print(
            f"{len(documentos)} documento(s) inserido(s) na coleção "
            f"'{collection_name}' (banco '{db_name}'; total na coleção: {total})."
        )

    def load_sqlite(
        self,
        df: pd.DataFrame,
        nome_banco: str = "radar.db",
        nome_tabela: str = "recife",
    ) -> None:
        """
        Salva um DataFrame transformado em uma tabela SQLite local.
        """
        conn = sqlite3.connect(nome_banco)
        df.to_sql(nome_tabela, conn, if_exists="replace", index=False)
        conn.close()

        print(
            f"Dados salvos com sucesso na tabela '{nome_tabela}' "
            f"do banco '{nome_banco}'!"
        )
