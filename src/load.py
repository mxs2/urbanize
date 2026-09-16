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

    def sqlite_mongo_ids(
        self,
        nome_banco: str = "database/radar.db",
        nome_tabela: str = "recife",
    ) -> set[str]:
        """
        Retorna os `mongo_id` já gravados no SQLite (vazio se a tabela não existir).
        """
        if not os.path.isfile(nome_banco):
            return set()

        conn = sqlite3.connect(nome_banco)
        try:
            cursor = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
                (nome_tabela,),
            )
            if cursor.fetchone() is None:
                return set()

            colunas = {
                row[1]
                for row in conn.execute(f"PRAGMA table_info({nome_tabela})")
            }
            if "mongo_id" not in colunas:
                raise ValueError(
                    f"A tabela '{nome_tabela}' em '{nome_banco}' não possui coluna "
                    "'mongo_id'. Remova o arquivo do banco ou recrie a tabela "
                    "após atualizar o pipeline."
                )

            ids = pd.read_sql_query(
                f"SELECT mongo_id FROM {nome_tabela}",
                conn,
            )["mongo_id"]
            return {str(mongo_id) for mongo_id in ids.dropna().tolist()}
        finally:
            conn.close()

    def load_sqlite(
        self,
        df: pd.DataFrame,
        nome_banco: str = "database/radar.db",
        nome_tabela: str = "recife",
    ) -> None:
        """
        Acrescenta linhas novas na tabela SQLite (append incremental).

        Ignora registros cujo `mongo_id` já existir na tabela. Cria índice único
        em `mongo_id` para evitar duplicatas em reexecuções.
        """
        if df.empty:
            print("Nenhuma linha nova para gravar no SQLite.")
            return

        if "mongo_id" not in df.columns:
            raise ValueError(
                "O DataFrame precisa da coluna 'mongo_id' (transformação a partir "
                "de documentos do MongoDB)."
            )

        os.makedirs(os.path.dirname(nome_banco) or ".", exist_ok=True)
        conn = sqlite3.connect(nome_banco)
        try:
            ja_persistidos = self.sqlite_mongo_ids(nome_banco, nome_tabela)
            df_novo = df[~df["mongo_id"].isin(ja_persistidos)].copy()
            if df_novo.empty:
                print(
                    f"Todas as linhas já existem na tabela '{nome_tabela}' "
                    f"('{nome_banco}')."
                )
                return

            tabela_existe = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
                (nome_tabela,),
            ).fetchone() is not None
            df_novo.to_sql(
                nome_tabela,
                conn,
                if_exists="append" if tabela_existe else "replace",
                index=False,
            )
            conn.execute(
                f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{nome_tabela}_mongo_id "
                f"ON {nome_tabela}(mongo_id)"
            )
            conn.commit()
        finally:
            conn.close()

        print(
            f"{len(df_novo)} linha(s) inserida(s) na tabela '{nome_tabela}' "
            f"do banco '{nome_banco}' (carga incremental)."
        )
