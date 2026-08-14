"""Settings router - Manage app-wide settings and LLM provider preference."""

from fastapi import APIRouter

from app.config import settings
from app.database import get_connection
from app.models.schemas import SettingsResponse, SettingsUpdate
from app.services.llm import check_provider_available

router = APIRouter()


@router.get("/settings", response_model=SettingsResponse)
async def get_settings() -> SettingsResponse:
    """Get current settings and provider availability."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT value FROM settings WHERE key = 'llm_provider'"
        ).fetchone()

        provider = row["value"] if row else settings.DEFAULT_LLM_PROVIDER

        gemini_ok = bool(settings.GEMINI_API_KEY)
        ollama_ok = await check_provider_available("ollama")

        return SettingsResponse(
            llm_provider=provider,
            gemini_available=gemini_ok,
            ollama_available=ollama_ok,
        )
    finally:
        conn.close()


@router.put("/settings", response_model=SettingsResponse)
async def update_settings(body: SettingsUpdate) -> SettingsResponse:
    """Update settings (e.g. default LLM provider)."""
    conn = get_connection()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('llm_provider', ?)",
            (body.llm_provider,),
        )
        conn.commit()

        gemini_ok = bool(settings.GEMINI_API_KEY)
        ollama_ok = await check_provider_available("ollama")

        return SettingsResponse(
            llm_provider=body.llm_provider,
            gemini_available=gemini_ok,
            ollama_available=ollama_ok,
        )
    finally:
        conn.close()
