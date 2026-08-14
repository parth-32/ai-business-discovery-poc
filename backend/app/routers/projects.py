"""Projects router - CRUD operations for projects."""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.models.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectListResponse,
    InputResponse,
    DiscoveryResponse,
    SolutionResponse,
    PocResponse,
)
from app.models.llm_outputs import PainPoint, Requirement, Gap, Improvement, Feature, UserRole, Screen, FlowStep

router = APIRouter()


@router.get("", response_model=list[ProjectListResponse])
async def list_projects() -> list[ProjectListResponse]:
    """List all projects with input counts."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT p.id, p.name, p.status, p.created_at, p.updated_at,
                      COUNT(i.id) as input_count
               FROM projects p
               LEFT JOIN inputs i ON p.id = i.project_id
               GROUP BY p.id
               ORDER BY p.created_at DESC"""
        ).fetchall()

        return [
            ProjectListResponse(
                id=row["id"],
                name=row["name"],
                status=row["status"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                input_count=row["input_count"],
            )
            for row in rows
        ]
    finally:
        conn.close()


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(body: ProjectCreate) -> ProjectResponse:
    """Create a new project."""
    conn = get_connection()
    try:
        project_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        conn.execute(
            "INSERT INTO projects (id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (project_id, body.name, "created", now, now),
        )
        conn.commit()

        return ProjectResponse(
            id=project_id,
            name=body.name,
            status="created",
            created_at=now,
            updated_at=now,
        )
    finally:
        conn.close()


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str) -> ProjectResponse:
    """Get a project with all nested data."""
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Fetch inputs
        input_rows = conn.execute(
            "SELECT * FROM inputs WHERE project_id = ?", (project_id,)
        ).fetchall()
        inputs = [
            InputResponse(
                id=row["id"],
                project_id=row["project_id"],
                type=row["type"],
                filename=row["filename"],
                raw_text=row["raw_text"],
                file_path=row["file_path"],
                extracted_at=row["extracted_at"],
            )
            for row in input_rows
        ]

        # Fetch discovery
        discovery_row = conn.execute(
            "SELECT * FROM discoveries WHERE project_id = ?", (project_id,)
        ).fetchone()
        discovery = None
        if discovery_row:
            discovery = DiscoveryResponse(
                id=discovery_row["id"],
                project_id=discovery_row["project_id"],
                main_goal=discovery_row["main_goal"],
                current_process=discovery_row["current_process"],
                pain_points=[PainPoint(**pp) for pp in json.loads(discovery_row["pain_points"])],
                requirements=[Requirement(**req) for req in json.loads(discovery_row["requirements"])],
                gaps=[Gap(**gap) for gap in json.loads(discovery_row["gaps"])],
                created_at=discovery_row["created_at"],
            )

        # Fetch solution
        solution_row = conn.execute(
            "SELECT * FROM solutions WHERE project_id = ?", (project_id,)
        ).fetchone()
        solution = None
        if solution_row:
            solution = SolutionResponse(
                id=solution_row["id"],
                project_id=solution_row["project_id"],
                improvements=[Improvement(**imp) for imp in json.loads(solution_row["improvements"])],
                features=[Feature(**f) for f in json.loads(solution_row["features"])],
                user_roles=[UserRole(**r) for r in json.loads(solution_row["user_roles"])],
                screens=[Screen(**s) for s in json.loads(solution_row["screens"])],
                flow_steps=[FlowStep(**fs) for fs in json.loads(solution_row["flow_steps"])],
                created_at=solution_row["created_at"],
            )

        # Fetch POC
        poc_row = conn.execute(
            "SELECT * FROM pocs WHERE project_id = ?", (project_id,)
        ).fetchone()
        poc = None
        if poc_row:
            poc = PocResponse(
                id=poc_row["id"],
                project_id=poc_row["project_id"],
                description=poc_row["description"],
                artifact_path=poc_row["artifact_path"],
                generated_at=poc_row["generated_at"],
            )

        return ProjectResponse(
            id=project["id"],
            name=project["name"],
            status=project["status"],
            created_at=project["created_at"],
            updated_at=project["updated_at"],
            inputs=inputs,
            discovery=discovery,
            solution=solution,
            poc=poc,
        )
    finally:
        conn.close()


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str) -> None:
    """Delete a project and all associated data."""
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?", (project_id,)
        ).fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # CASCADE will handle related records
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
    finally:
        conn.close()
