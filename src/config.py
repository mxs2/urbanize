import os

from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB", "urbanize_etl")
MONGODB_RAW_COLLECTION = os.getenv("MONGODB_RAW_COLLECTION", "radar_recife_raw")
DATABASE_URL = os.getenv("DATABASE_URL")
