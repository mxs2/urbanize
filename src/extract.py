import requests
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

load_dotenv()


class Extract:
    """
    Responsável por extrair dados de agregados da API de agregados do
    IBGE (SIDRA). O método `agregado` é genérico e pode ser reutilizado
    para qualquer agregado do IBGE; `pnadc` é um atalho já configurado
    para o agregado 4093 (PNAD Contínua).

    Também é capaz de reler, de uma coleção do MongoDB, dados que já
    foram carregados anteriormente por `Load.load_mongo`, para alimentar
    a etapa de transformação do pipeline.
    """

    UFS = {
        11: "Rondônia",
        12: "Acre",
        13: "Amazonas",
        14: "Roraima",
        15: "Pará",
        16: "Amapá",
        17: "Tocantins",
        21: "Maranhão",
        22: "Piauí",
        23: "Ceará",
        24: "Rio Grande do Norte",
        25: "Paraíba",
        26: "Pernambuco",
        27: "Alagoas",
        28: "Sergipe",
        29: "Bahia",
        31: "Minas Gerais",
        32: "Espírito Santo",
        33: "Rio de Janeiro",
        35: "São Paulo",
        41: "Paraná",
        42: "Santa Catarina",
        43: "Rio Grande do Sul",
        50: "Mato Grosso do Sul",
        51: "Mato Grosso",
        52: "Goiás",
        53: "Distrito Federal",
    }

    VARIAVEIS_PNADC = {
        1641: "Pessoas de 14 anos ou mais de idade",
        4087: "Coeficiente de variação - Pessoas de 14 anos ou mais de idade",
        4104: "Distribuição percentual das pessoas de 14 anos ou mais de idade",
        4105: "Coeficiente de variação - Distribuição percentual das pessoas de 14 anos ou mais de idade",
        4088: "Pessoas de 14 anos ou mais de idade, na força de trabalho, na semana de referência",
        4089: "Coeficiente de variação - Pessoas de 14 anos ou mais de idade, na força de trabalho",
        4106: "Distribuição percentual das pessoas de 14 anos ou mais de idade, na força de trabalho",
        4107: "Coeficiente de variação - Distribuição percentual das pessoas de 14 anos ou mais de idade, na força de trabalho",
        4090: "Pessoas de 14 anos ou mais de idade ocupadas na semana de referência",
        4091: "Coeficiente de variação - Pessoas de 14 anos ou mais de idade ocupadas",
        4108: "Distribuição percentual das pessoas de 14 anos ou mais de idade ocupadas",
        4109: "Coeficiente de variação - Distribuição percentual das pessoas de 14 anos ou mais de idade ocupadas",
        4092: "Pessoas de 14 anos ou mais de idade, desocupadas na semana de referência",
        4093: "Coeficiente de variação - Pessoas de 14 anos ou mais de idade, desocupadas",
        4110: "Distribuição percentual das pessoas de 14 anos ou mais de idade, desocupadas",
        4111: "Coeficiente de variação - Distribuição percentual das pessoas de 14 anos ou mais de idade, desocupadas",
        4094: "Pessoas de 14 anos ou mais de idade, fora da força de trabalho",
        4095: "Coeficiente de variação - Pessoas de 14 anos ou mais de idade, fora da força de trabalho",
        4112: "Distribuição percentual das pessoas de 14 anos ou mais de idade, fora da força de trabalho",
        4113: "Coeficiente de variação - Distribuição percentual das pessoas de 14 anos ou mais de idade, fora da força de trabalho",
        4096: "Taxa de participação na força de trabalho",
        4100: "Coeficiente de variação - Taxa de participação na força de trabalho",
        4097: "Nível da ocupação",
        4101: "Coeficiente de variação - Nível da ocupação",
        4098: "Nível da desocupação",
        4102: "Coeficiente de variação - Nível de desocupação",
        4099: "Taxa de desocupação",
        4103: "Coeficiente de variação - Taxa de desocupação",
        12466: "Taxa de informalidade das pessoas de 14 anos ou mais de idade ocupadas",
        12467: "Coeficiente de variação - Taxa de informalidade das pessoas ocupadas",
        4723: "Pessoas de 14 anos ou mais de idade ocupadas, em situação de informalidade",
        4724: "Coeficiente de variação - Pessoas de 14 anos ou mais de idade ocupadas, em situação de informalidade",
    }

    def __init__(self):
        self.base_url = "https://servicodados.ibge.gov.br/api/v3/agregados"
        self.mongo_uri = os.getenv("MONGODB_URI")
        self.client = MongoClient(self.mongo_uri, server_api=ServerApi("1"))

    def close(self) -> None:
        """Encerra a conexão com o MongoDB."""
        self.client.close()

    def agregado(
        self,
        agregado_id: int,
        variavel: int,
        estado: int,
        periodo_inicio: str,
        periodo_fim: str,
        classificacao: str = "2[all]",
    ) -> list[dict]:
        """
        Busca, na API de agregados do IBGE, a série histórica de uma
        variável de um agregado (tabela) qualquer, para uma UF.

        Atributos:
            agregado_id: código do agregado (tabela) do IBGE
            variavel: código da variável do agregado
            estado: código IBGE da UF (ver `Extract.UFS`)
            periodo_inicio: início do período da série, no formato AAAAMM
            periodo_fim: fim do período da série, no formato AAAAMM
            classificacao: classificação/categoria da consulta (padrão: "2[all]")
        """
        if estado not in self.UFS:
            raise ValueError(f"Código de UF inválido: {estado}")

        url = (
            f"{self.base_url}/{agregado_id}/periodos/{periodo_inicio}-{periodo_fim}"
            f"/variaveis/{variavel}?localidades=N3[{estado}]&classificacao={classificacao}"
        )
        response = requests.get(url)
        response.raise_for_status()

        print(f"Dados extraídos com sucesso da API do IBGE (agregado {agregado_id})!")
        return response.json()

    def pnadc(
        self,
        variavel: int,
        estado: int,
        periodo_inicio: str = "201201",
        periodo_fim: str = "202602",
    ) -> list[dict]:
        """
        Busca, no agregado 4093 (PNAD Contínua), a série histórica de uma
        variável para uma UF, em um período (por padrão, entre 2012-01 e
        2026-02).

        Atributos:
            variavel: código da variável do agregado 4093 (ver `Extract.VARIAVEIS_PNADC`)
            estado: código IBGE da UF (ver `Extract.UFS`)
            periodo_inicio: início do período da série, no formato AAAAMM
            periodo_fim: fim do período da série, no formato AAAAMM
        """
        if variavel not in self.VARIAVEIS_PNADC:
            raise ValueError(
                f"Código de variável inválido para o agregado 4093: {variavel}"
            )

        return self.agregado(
            agregado_id=4093,
            variavel=variavel,
            estado=estado,
            periodo_inicio=periodo_inicio,
            periodo_fim=periodo_fim,
        )

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
