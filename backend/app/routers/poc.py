"""POC router - Serve and download generated HTML POC artifacts."""

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse

from app.database import get_connection

router = APIRouter()

GENERATED_POCS_DIR = Path(__file__).parent.parent.parent / "generated_pocs"


@router.get("/{project_id}/poc", response_class=HTMLResponse)
async def get_poc_html(project_id: str) -> HTMLResponse:
    """Serve the generated POC HTML file for preview iframe."""
    conn = get_connection()
    try:
        poc_row = conn.execute(
            "SELECT artifact_path FROM pocs WHERE project_id = ?", (project_id,)
        ).fetchone()

        if not poc_row:
            raise HTTPException(status_code=404, detail="POC not found for this project")

        poc_path = Path(poc_row["artifact_path"])
        if not poc_path.exists():
            raise HTTPException(status_code=404, detail="POC artifact file missing on disk")

        content = poc_path.read_text(encoding="utf-8")
        return HTMLResponse(content=content)
    finally:
        conn.close()


@router.get("/{project_id}/poc/download")
async def download_poc_file(project_id: str) -> FileResponse:
    """Download the generated POC HTML file."""
    conn = get_connection()
    try:
        poc_row = conn.execute(
            "SELECT artifact_path FROM pocs WHERE project_id = ?", (project_id,)
        ).fetchone()

        if not poc_row:
            raise HTTPException(status_code=404, detail="POC not found for this project")

        poc_path = Path(poc_row["artifact_path"])
        if not poc_path.exists():
            raise HTTPException(status_code=404, detail="POC artifact file missing on disk")

        return FileResponse(
            path=poc_path,
            filename=f"poc-{project_id[:8]}.html",
            media_type="text/html",
        )
    finally:
        conn.close()
