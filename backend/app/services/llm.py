"""LLM service - LangChain-based unified interface for Gemini and Ollama.

Provides a factory for creating LLM instances and an invoke_with_fallback
function that automatically falls back to the secondary provider on error.
"""

import asyncio
import logging
from typing import TypeVar

from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from pydantic import BaseModel

from app.config import settings
from app.constants import LLMProvider

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def get_llm(provider: str) -> BaseChatModel:
    """Create an LLM instance for the given provider.

    Args:
        provider: Either "gemini" or "ollama".

    Returns:
        A LangChain chat model instance.

    Raises:
        ValueError: If the provider is unknown.
    """
    if provider == LLMProvider.GEMINI:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in environment")
        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.3,
        )
    elif provider == LLMProvider.OLLAMA:
        return ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0.3,
        )
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")


def get_fallback_provider(primary: str) -> str:
    """Get the fallback provider for a given primary.

    Args:
        primary: The primary provider name.

    Returns:
        The fallback provider name.
    """
    if primary == LLMProvider.GEMINI:
        return LLMProvider.OLLAMA
    return LLMProvider.GEMINI


async def invoke_with_structured_output(
    prompt: str,
    output_schema: type[T],
    primary_provider: str,
) -> T:
    """Invoke LLM with structured output and automatic fallback.

    Tries the primary provider first. On failure, falls back to the other provider.
    Executes in a worker thread to keep the asyncio event loop unblocked.

    Args:
        prompt: The prompt to send to the LLM.
        output_schema: Pydantic model class for structured output.
        primary_provider: Primary LLM provider to try first.

    Returns:
        Parsed structured output matching the schema.

    Raises:
        Exception: If both primary and fallback fail.
    """
    fallback_provider = get_fallback_provider(primary_provider)

    # Try primary provider
    try:
        llm = get_llm(primary_provider)
        structured_llm = llm.with_structured_output(output_schema, method="json_schema")
        result = await asyncio.to_thread(structured_llm.invoke, prompt)
        logger.info(f"LLM call successful with {primary_provider}")
        return result
    except Exception as primary_error:
        logger.warning(
            f"{primary_provider} failed: {primary_error}. "
            f"Falling back to {fallback_provider}."
        )

    # Try fallback provider
    try:
        llm = get_llm(fallback_provider)
        structured_llm = llm.with_structured_output(output_schema, method="json_schema")
        result = await asyncio.to_thread(structured_llm.invoke, prompt)
        logger.info(f"LLM call successful with fallback {fallback_provider}")
        return result
    except Exception as fallback_error:
        logger.error(
            f"Both providers failed. Primary ({primary_provider}): {primary_error}. "
            f"Fallback ({fallback_provider}): {fallback_error}."
        )
        raise RuntimeError(
            f"LLM call failed with both providers. "
            f"Primary ({primary_provider}): {primary_error}. "
            f"Fallback ({fallback_provider}): {fallback_error}."
        ) from fallback_error


async def invoke_raw(prompt: str, primary_provider: str) -> str:
    """Invoke LLM and return raw text output (used for POC HTML generation).

    Executes in a worker thread to keep the asyncio event loop unblocked.

    Args:
        prompt: The prompt to send.
        primary_provider: Primary LLM provider.

    Returns:
        Raw text response from the LLM.
    """
    fallback_provider = get_fallback_provider(primary_provider)

    for provider in [primary_provider, fallback_provider]:
        try:
            llm = get_llm(provider)
            response = await asyncio.to_thread(llm.invoke, prompt)
            logger.info(f"Raw LLM call successful with {provider}")
            return response.content
        except Exception as e:
            logger.warning(f"{provider} failed for raw invoke: {e}")

    raise RuntimeError("LLM raw invoke failed with both providers.")


async def check_provider_available(provider: str) -> bool:
    """Check if an LLM provider is available and responsive.

    Uses a 3-second timeout and worker thread to avoid blocking server requests.

    Args:
        provider: The provider to check.

    Returns:
        True if the provider is available.
    """
    try:
        llm = get_llm(provider)
        await asyncio.wait_for(asyncio.to_thread(llm.invoke, "Say 'ok'"), timeout=3.0)
        return True
    except Exception as e:
        logger.info(f"Provider {provider} not available: {e}")
        return False
