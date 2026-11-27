"""
Acesso de leitura à camada prata (NeonDB) usado pelo servidor MCP.

O servidor nunca fala com a API do Radar Meteorológico: tudo o que ele mostra
passou antes pela pipeline (API -> MongoDB -> transformação -> Neon).
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import create_engine, inspect, text

import src.config as config


def _serializavel(valor):
    """Converte valores do Postgres em tipos que viram JSON sem perda de sentido."""
    if isinstance(valor, (datetime, date)):
        return valor.isoformat()
    if isinstance(valor, Decimal):
        return float(valor)
    return valor


class BancoNeon:
    """Consultas somente leitura no NeonDB (schema public)."""

    def __init__(self, url: str | None = None) -> None:
        url = url or config.DATABASE_URL
        if not url:
            raise ValueError(
                "DATABASE_URL não definida. Configure a connection string do "
                "NeonDB no .env."
            )
        self.engine = create_engine(url, pool_pre_ping=True)

    def listar_tabelas(self) -> list[str]:
        return sorted(inspect(self.engine).get_table_names(schema="public"))

    def descrever_tabela(self, tabela: str) -> list[dict]:
        self._validar_tabela(tabela)
        colunas = inspect(self.engine).get_columns(tabela, schema="public")
        return [{"coluna": c["name"], "tipo": str(c["type"])} for c in colunas]

    def consultar(self, sql: str) -> list[dict]:
        """
        Executa um SELECT e devolve as linhas como dicionários.

        A transação é aberta como READ ONLY, então o próprio Postgres recusa
        INSERT, UPDATE, DELETE, DROP etc., mesmo que venham disfarçados.
        """
        comando = sql.strip().rstrip(";").strip()
        if not comando.lower().startswith(("select", "with")):
            raise ValueError("Só são permitidas consultas SELECT.")

        with self.engine.connect() as conn:
            conn.execute(text("SET TRANSACTION READ ONLY"))
            resultado = conn.execute(text(comando))
            colunas = list(resultado.keys())
            linhas = [
                {col: _serializavel(v) for col, v in zip(colunas, linha)}
                for linha in resultado
            ]
            conn.rollback()
        return linhas

    def contar_linhas(self, tabela: str) -> int:
        """Exercício 1: quantas linhas a tabela tem."""
        self._validar_tabela(tabela)
        with self.engine.connect() as conn:
            # O nome já foi conferido contra a lista de tabelas existentes,
            # então pode entrar na consulta entre aspas sem risco de injeção.
            return conn.execute(
                text(f'SELECT COUNT(*) FROM public."{tabela}"')
            ).scalar_one()

    def _validar_tabela(self, tabela: str) -> None:
        if tabela not in self.listar_tabelas():
            raise ValueError(
                f"Tabela '{tabela}' não existe. Tabelas disponíveis: "
                f"{', '.join(self.listar_tabelas())}."
            )


class BancoComLimite(BancoNeon):
    """Exercício 3: igual ao BancoNeon, mas consultar devolve no máximo 10 linhas."""

    LIMITE = 10

    def consultar(self, sql: str) -> list[dict]:
        return super().consultar(sql)[: self.LIMITE]
