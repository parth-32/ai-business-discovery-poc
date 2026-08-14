"""Analysis router - Triggers the pipeline as background task and handles SSE streaming."""

import asyncio
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.config import settings
from app.database import get_connection
from app.models.schemas import AnalysisRequest
from app.services.pipeline import (
    start_pipeline_background,
    subscribe_project_events,
    unsubscribe_project_events,
    is_pipeline_running,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/{project_id}/analyze")
async def start_analysis(
    project_id: str,
    body: AnalysisRequest | None = None,
) -> dict[str, str]:
    """Trigger the analysis pipeline for a project as a background task."""
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id, status FROM projects WHERE id = ?", (project_id,)
        ).fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Check if project has inputs
        input_count = conn.execute(
            "SELECT COUNT(*) as count FROM inputs WHERE project_id = ?", (project_id,)
        ).fetchone()["count"]

        if input_count == 0:
            raise HTTPException(status_code=400, detail="Project has no inputs. Upload inputs before analyzing.")
    finally:
        conn.close()

    llm_provider = (body.llm_provider if body and body.llm_provider else settings.DEFAULT_LLM_PROVIDER)
    started = start_pipeline_background(project_id, llm_provider)

    if not started:
        return {"message": "Analysis is already running in background", "project_id": project_id}

    return {"message": "Analysis started in background", "project_id": project_id}


@router.get("/{project_id}/stream")
async def stream_analysis_progress(
    project_id: str,
    provider: str | None = None,
) -> StreamingResponse:
    """Stream analysis pipeline progress using Server-Sent Events (SSE)."""
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id, status FROM projects WHERE id = ?", (project_id,)
        ).fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        project_status = project["status"]
    finally:
        conn.close()

    llm_provider = provider or settings.DEFAULT_LLM_PROVIDER

    # If pipeline is not running, ensure background task is started if project is created/analyzing
    if not is_pipeline_running(project_id) and project_status != "completed":
        start_pipeline_background(project_id, llm_provider)

    async def event_generator():
        queue = subscribe_project_events(project_id)
        try:
            while True:
                try:
                    event_json = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {event_json}\n\n"
                    # Exit stream if stage complete or error
                    if '"status":"complete"' in event_json and '"stage":"poc"' in event_json:
                        break
                    if '"status":"error"' in event_json:
                        break
                except asyncio.TimeoutError:
                    # SSE heartbeat keepalive ping comment
                    yield ": ping\n\n"
        finally:
            unsubscribe_project_events(project_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
