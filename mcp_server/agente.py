"""
Agente de linha de comando: um modelo (via biblioteca openai) que responde
perguntas sobre o clima de Recife usando as ferramentas do servidor MCP.

    python -m mcp_server.agente

Configuração no .env: OPENAI_API_KEY, MODELO (padrão gpt-6-luna) e, para
serviços gratuitos compatíveis com a biblioteca openai, OPENAI_BASE_URL.
"""

import asyncio
import json
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import APIError, OpenAI

import src.config as config

RAIZ = Path(__file__).resolve().parent.parent

for _stream in (sys.stdout, sys.stderr):
    if _stream is not None and hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (OSError, ValueError):
            pass

SISTEMA = (
    "Você é um assistente que responde perguntas sobre o clima de Recife em "
    "português. Use as ferramentas para consultar o banco antes de responder; "
    "não invente números. As datas no banco estão em UTC (Recife é UTC-3)."
)


def ferramentas_para_openai(ferramentas) -> list[dict]:
    """Traduz a lista de ferramentas do MCP para o formato de tools da OpenAI."""
    return [
        {
            "type": "function",
            "function": {
                "name": f.name,
                "description": f.description or "",
                "parameters": f.input_schema,
            },
        }
        for f in ferramentas
    ]


def texto_do_resultado(resultado) -> str:
    if resultado.structured_content is not None:
        return json.dumps(resultado.structured_content, ensure_ascii=False)
    return "\n".join(getattr(c, "text", str(c)) for c in resultado.content)


async def responder(sessao: ClientSession, cliente: OpenAI, tools, mensagens) -> str:
    """Chama o modelo até ele parar de pedir ferramentas e devolver texto."""
    while True:
        resposta = cliente.chat.completions.create(
            model=config.MODELO, messages=mensagens, tools=tools
        )
        msg = resposta.choices[0].message
        mensagens.append(msg.model_dump(exclude_none=True))

        if not msg.tool_calls:
            return msg.content or ""

        for chamada in msg.tool_calls:
            argumentos = json.loads(chamada.function.arguments or "{}")
            print(f"  [ferramenta] {chamada.function.name}({argumentos})")
            resultado = await sessao.call_tool(chamada.function.name, argumentos)
            mensagens.append(
                {
                    "role": "tool",
                    "tool_call_id": chamada.id,
                    "content": texto_do_resultado(resultado),
                }
            )


async def main() -> None:
    if not config.OPENAI_API_KEY:
        sys.exit("OPENAI_API_KEY não definida no .env.")

    # Serviços gratuitos devolvem 503 (sobrecarga) e 429 (limite de uso) com
    # frequência; a biblioteca repete esses pedidos sozinha, esperando um pouco
    # mais a cada tentativa.
    cliente = OpenAI(
        api_key=config.OPENAI_API_KEY,
        base_url=config.OPENAI_BASE_URL,
        max_retries=5,
    )
    parametros = StdioServerParameters(
        command=sys.executable, args=["-m", "mcp_server.servidor"], cwd=str(RAIZ)
    )

    async with stdio_client(parametros) as (leitura, escrita):
        async with ClientSession(leitura, escrita) as sessao:
            await sessao.initialize()
            tools = ferramentas_para_openai((await sessao.list_tools()).tools)
            print(
                f"Modelo: {config.MODELO}. Ferramentas: {[t['function']['name'] for t in tools]}"
            )
            print("Pergunte sobre o clima de Recife (linha vazia para sair).\n")

            mensagens = [{"role": "system", "content": SISTEMA}]
            while True:
                pergunta = input("Você: ").strip()
                if not pergunta:
                    break
                tamanho = len(mensagens)
                mensagens.append({"role": "user", "content": pergunta})
                try:
                    resposta = await responder(sessao, cliente, tools, mensagens)
                except APIError as exc:
                    # Desfaz a pergunta que falhou, para o histórico não ficar
                    # com uma chamada de ferramenta sem resposta.
                    del mensagens[tamanho:]
                    status = getattr(exc, "status_code", "")
                    print(
                        f"Agente: o serviço do modelo falhou ({status}). Tente de "
                        "novo em alguns segundos ou troque o MODELO no .env.\n"
                    )
                    continue
                print(f"Agente: {resposta}\n")


if __name__ == "__main__":
    asyncio.run(main())
