"""Inputs router - Handle file uploads, URL inputs, and sample data loading."""

import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.config import settings
from app.database import get_connection
from app.models.schemas import InputResponse, UrlInput
from app.services.ingestion import detect_input_type

router = APIRouter()

UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"
SAMPLE_DATA_DIR = Path(__file__).parent.parent.parent / "sample_data"


@router.post("/{project_id}/inputs", response_model=list[InputResponse])
async def upload_files(
    project_id: str,
    files: list[UploadFile] = File(...),
) -> list[InputResponse]:
    """Upload one or more files to a project."""
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?", (project_id,)
        ).fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        responses: list[InputResponse] = []

        for file in files:
            if not file.filename:
                continue

            # Read content to verify file size
            content = await file.read()
            if len(content) > settings.max_file_size_bytes:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB",
                )

            input_id = str(uuid.uuid4())
            input_type = detect_input_type(file.filename)
            safe_filename = f"{input_id}_{file.filename}"
            file_path = UPLOADS_DIR / safe_filename

            # Write file to uploads directory
            with open(file_path, "wb") as f:
                f.write(content)

            now = datetime.now(timezone.utc).isoformat()
            conn.execute(
                """INSERT INTO inputs (id, project_id, type, filename, file_path, extracted_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (input_id, project_id, input_type, file.filename, str(file_path), now),
            )

            responses.append(
                InputResponse(
                    id=input_id,
                    project_id=project_id,
                    type=input_type,
                    filename=file.filename,
                    file_path=str(file_path),
                    extracted_at=now,
                )
            )

        conn.commit()
        return responses
    finally:
        conn.close()


@router.post("/{project_id}/inputs/url", response_model=InputResponse)
async def add_url_input(project_id: str, body: UrlInput) -> InputResponse:
    """Add a website URL as an input to the project."""
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?", (project_id,)
        ).fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        input_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        conn.execute(
            """INSERT INTO inputs (id, project_id, type, filename, file_path, extracted_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (input_id, project_id, "url", body.url, body.url, now),
        )
        conn.commit()

        return InputResponse(
            id=input_id,
            project_id=project_id,
            type="url",
            filename=body.url,
            file_path=body.url,
            extracted_at=now,
        )
    finally:
        conn.close()


@router.delete("/{project_id}/inputs/{input_id}", status_code=204)
async def delete_input(project_id: str, input_id: str) -> None:
    """Delete a specific input from a project."""
    conn = get_connection()
    try:
        input_row = conn.execute(
            "SELECT id, file_path, type FROM inputs WHERE id = ? AND project_id = ?",
            (input_id, project_id),
        ).fetchone()

        if not input_row:
            raise HTTPException(status_code=404, detail="Input not found")

        # Delete physical file if not URL
        file_path_str = input_row["file_path"]
        if file_path_str and input_row["type"] != "url":
            file_path = Path(file_path_str)
            if file_path.exists():
                file_path.unlink()

        conn.execute("DELETE FROM inputs WHERE id = ?", (input_id,))
        conn.commit()
    finally:
        conn.close()


@router.post("/{project_id}/load-sample/{scenario}", response_model=list[InputResponse])
async def load_sample_data(project_id: str, scenario: str) -> list[InputResponse]:
    """Load pre-configured sample scenario files into a project."""
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?", (project_id,)
        ).fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        scenario_dir = SAMPLE_DATA_DIR / scenario
        if not scenario_dir.exists() or not scenario_dir.is_dir():
            raise HTTPException(
                status_code=404,
                detail=f"Sample scenario '{scenario}' not found",
            )

        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        responses: list[InputResponse] = []

        for sample_file in scenario_dir.glob("*"):
            if sample_file.is_dir():
                continue

            input_id = str(uuid.uuid4())
            input_type = detect_input_type(sample_file.name)
            dest_filename = f"{input_id}_{sample_file.name}"
            dest_path = UPLOADS_DIR / dest_filename

            # Copy sample file to uploads directory
            shutil.copy(sample_file, dest_path)

            now = datetime.now(timezone.utc).isoformat()
            conn.execute(
                """INSERT INTO inputs (id, project_id, type, filename, file_path, extracted_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (input_id, project_id, input_type, sample_file.name, str(dest_path), now),
            )

            responses.append(
                InputResponse(
                    id=input_id,
                    project_id=project_id,
                    type=input_type,
                    filename=sample_file.name,
                    file_path=str(dest_path),
                    extracted_at=now,
                )
            )

        conn.commit()
        return responses
    finally:
        conn.close()
