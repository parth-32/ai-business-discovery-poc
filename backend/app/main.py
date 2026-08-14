"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_database
from app.routers import projects, inputs, analysis, poc, app_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan - runs on startup and shutdown."""
    logger.info("Initializing database...")
    init_database()
    logger.info("Application started successfully")
    yield
    logger.info("Application shutting down")


app = FastAPI(
    title="AI Business Discovery → POC Generator",
    description="Take scattered client inputs, understand the business need, and generate a solution POC.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(inputs.router, prefix="/api/projects", tags=["Inputs"])
app.include_router(analysis.router, prefix="/api/projects", tags=["Analysis"])
app.include_router(poc.router, prefix="/api/projects", tags=["POC"])
app.include_router(app_settings.router, prefix="/api", tags=["Settings"])


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}
