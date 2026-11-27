import os

from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB", "urbanize_etl")
MONGODB_RAW_COLLECTION = os.getenv("MONGODB_RAW_COLLECTION", "radar_recife_raw")
DATABASE_URL = os.getenv("DATABASE_URL")

# Agente (mcp_server/agente.py): chave e modelo do serviço compatível com a
# biblioteca openai. OPENAI_BASE_URL vazio = API da própria OpenAI.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL") or None
MODELO = os.getenv("MODELO") or "gpt-6-luna"
