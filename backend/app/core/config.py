from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    # AI providers are optional: the flagship case is fully playable without them.
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    # When False (default) the legacy AI endpoints return 503 instead of canned demo output.
    AI_DEMO_MODE: bool = False
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    # Includes Capacitor WebView origins (Android: https://localhost, iOS: capacitor://localhost)
    CORS_ORIGINS: str = "http://localhost:3000,capacitor://localhost,https://localhost,http://localhost"
    ENVIRONMENT: str = "development"

    # RevenueCat (server side). The SECRET key never ships in the mobile app.
    REVENUECAT_SECRET_API_KEY: str = ""
    REVENUECAT_WEBHOOK_AUTH: str = ""
    REVENUECAT_ENTITLEMENT_ID: str = "pro"
    REVENUECAT_API_BASE: str = "https://api.revenuecat.com/v1"
    ENTITLEMENT_CACHE_SECONDS: int = 300
    ENTITLEMENT_OFFLINE_GRACE_SECONDS: int = 86400

    # Free-tier limits (see docs/MONETIZATION.md)
    FREE_HINTS_PER_CASE: int = 3
    FREE_AI_CASES: int = 2

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()

if settings.is_production and (
    len(settings.SECRET_KEY) < 32 or settings.SECRET_KEY.startswith("your-")
):
    raise RuntimeError("SECRET_KEY must be a random string of at least 32 characters in production")
