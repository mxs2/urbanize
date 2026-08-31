from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
import sqlite3
import pandas as pd

load_dotenv()


class Load:
    """
    Responsável por persistir os dados do pipeline: o resultado bruto da
    extração em um arquivo JSON local ou em uma coleção do MongoDB, e o
    resultado já transformado em uma tabela de um banco SQLite.
    """

    def __init__(self):
        self.mongo_uri = os.getenv("MONGODB_URI")
        self.client = MongoClient(self.mongo_uri, server_api=ServerApi("1"))

    def close(self) -> None:
        """Encerra a conexão com o MongoDB."""
        self.client.close()

    def load_json(self, nome_arquivo: str, data: list[dict]) -> None:
        """
        Salva o resultado da extração em um arquivo JSON local, em jsons/.

        Atributos:
            nome_arquivo: nome do arquivo de destino, sem extensão
            data: lista de dicionários retornada pela API externa
        """
        with open(f"jsons/{nome_arquivo}.json", "w", encoding="UTF-8") as f:
            f.write(str(data))

        print(f"Dados salvos com sucesso em 'jsons/{nome_arquivo}.json'!")

    def load_mongo(self, data: list[dict], db_name: str, collection_name: str) -> None:
        """
        Insere o resultado bruto da extração em uma coleção do MongoDB.

        Atributos:
            data: lista de dicionários retornada pela API externa
            db_name: nome do banco de dados no MongoDB
            collection_name: nome da coleção onde os documentos serão inseridos
        """
        collection = self.client[db_name][collection_name]

        if data:
            collection.insert_many(data)

        print(f"Dados inseridos com sucesso na coleção '{collection_name}'!")
        self.close()

    def load_sqlite(
        self,
        df: pd.DataFrame,
        nome_banco: str = "inmet.db",
        nome_tabela: str = "recife",
    ) -> None:
        """
        Salva um DataFrame transformado em uma tabela de um banco SQLite local.

        Atributos:
            df: DataFrame a ser salvo (ex.: retorno de `Transform.transform_inmet`)
            nome_banco: nome do arquivo do banco SQLite
            nome_tabela: nome da tabela onde os dados serão gravados
        """
        conn = sqlite3.connect(nome_banco)
        df.to_sql(nome_tabela, conn, if_exists="replace", index=False)
        conn.close()

        print(
            f"Dados salvos com sucesso na tabela '{nome_tabela}' do banco '{nome_banco}'!"
        )
