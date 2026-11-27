"""
Servidor MCP que expõe a tabela de clima de Recife gravada no NeonDB.

Pode ser iniciado como módulo ou pelo caminho do arquivo, de qualquer diretório:

    python -m mcp_server.servidor
    python mcp_server/servidor.py

Ele conversa por stdio, então não imprime nada no terminal: quem o inicia é
um cliente MCP (o agente em mcp_server/agente.py, o Claude, o MCP Inspector...).
"""

import sys
from contextlib import contextmanager
from pathlib import Path

# Coloca a raiz do projeto no caminho de importação, para `src` e `mcp_server`
# funcionarem mesmo quando o cliente MCP inicia o arquivo de outro diretório.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from mcp.server.mcpserver import MCPServer  # noqa: E402
from mcp.server.mcpserver.exceptions import ToolError
from sqlalchemy.exc import SQLAlchemyError

from mcp_server.banco import BancoComLimite

mcp = MCPServer(
    "radar-recife",
    instructions=(
        "Dados de clima de Recife coletados da API pública do Radar "
        "Meteorológico e tratados pela pipeline do grupo. A tabela principal "
        "é 'recife': uma linha por leitura, com temperatura, máxima, mínima, "
        "chuva_mm, condicao e data_extracao (UTC). Consultas devolvem no "
        "máximo 10 linhas: prefira agregações (COUNT, AVG, MAX, GROUP BY)."
    ),
)
banco = BancoComLimite()


@contextmanager
def erros_legiveis():
    """
    Devolve ao cliente a mensagem real do erro (tabela inexistente, SQL
    inválido, tentativa de escrita...), para o modelo poder corrigir a
    chamada. Sem isso o MCP responde só "Error executing tool".
    """
    try:
        yield
    except ValueError as exc:
        raise ToolError(str(exc)) from exc
    except SQLAlchemyError as exc:
        detalhe = str(getattr(exc, "orig", None) or exc).strip().splitlines()[0]
        raise ToolError(f"Erro no banco: {detalhe}") from exc


@mcp.tool()
def listar_tabelas() -> list[str]:
    """Lista as tabelas disponíveis no banco."""
    with erros_legiveis():
        return banco.listar_tabelas()


@mcp.tool()
def descrever_tabela(tabela: str) -> list[dict]:
    """Mostra as colunas e os tipos de uma tabela."""
    with erros_legiveis():
        return banco.descrever_tabela(tabela)


@mcp.tool()
def consultar(sql: str) -> list[dict]:
    """Executa uma consulta SELECT (somente leitura, até 10 linhas) e devolve o resultado."""
    with erros_legiveis():
        return banco.consultar(sql)


@mcp.tool()
def contar_linhas(tabela: str) -> int:
    """Devolve quantas linhas a tabela tem."""
    with erros_legiveis():
        return banco.contar_linhas(tabela)


if __name__ == "__main__":
    mcp.run()
