"""
Configuration for the data seeder.
Reads Supabase credentials from app/.env.local.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env.local from the project root (one level up from data/seed/)
env_path = Path(__file__).resolve().parent.parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY)

# Insertion config
BATCH_SIZE = 500
