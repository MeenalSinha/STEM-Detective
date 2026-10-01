import os

# Tests must never reach a real AI provider or RevenueCat. Empty keys = "AI not configured".
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-key")
os.environ["OPENAI_API_KEY"] = ""
os.environ["GEMINI_API_KEY"] = ""
os.environ["REVENUECAT_SECRET_API_KEY"] = ""
os.environ.setdefault("SECRET_KEY", "test-secret-key-minimum-32-characters-long")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
# DATABASE_URL must point at a Postgres with pgvector (see docs/SETUP.md).
