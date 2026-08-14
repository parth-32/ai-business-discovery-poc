"""Pipeline orchestration service - runs the 5-stage analysis pipeline.

Stages: Ingest → Extract → Synthesize → Outline → Generate POC
Each stage emits SSE events for real-time progress tracking.
"""

import asyncio
import json
import logging
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from pathlib import Path

from app.constants import InputType, PipelineStage, PipelineStageStatus, PIPELINE_STAGES_ORDERED
from app.database import get_connection
from app.models.llm_outputs import DiscoveryOutput, SynthesisOutput, OutlineOutput
from app.models.schemas import PipelineEvent
from app.services.ingestion import extract_text, extract_url
from app.services.llm import invoke_with_structured_output
from app.services.poc_generator import generate_poc_html

logger = logging.getLogger(__name__)

GENERATED_POCS_DIR = Path(__file__).parent.parent.parent / "generated_pocs"

# In-memory background task registry & event listeners
_running_tasks: dict[str, asyncio.Task] = {}
_project_listeners: dict[str, set[asyncio.Queue]] = {}


def is_pipeline_running(project_id: str) -> bool:
    """Check if an analysis pipeline task is currently running for a project."""
    task = _running_tasks.get(project_id)
    return task is not None and not task.done()


def subscribe_project_events(project_id: str) -> asyncio.Queue:
    """Subscribe an asyncio.Queue to real-time events for a project."""
    queue = asyncio.Queue()
    if project_id not in _project_listeners:
        _project_listeners[project_id] = set()
    _project_listeners[project_id].add(queue)
    return queue


def unsubscribe_project_events(project_id: str, queue: asyncio.Queue) -> None:
    """Unsubscribe an asyncio.Queue from project events."""
    if project_id in _project_listeners:
        _project_listeners[project_id].discard(queue)
        if not _project_listeners[project_id]:
            _project_listeners.pop(project_id, None)


def _broadcast_event(project_id: str, event_json: str) -> None:
    """Broadcast an SSE event string to all active queues for a project."""
    listeners = _project_listeners.get(project_id, set())
    for queue in list(listeners):
        try:
            queue.put_nowait(event_json)
        except Exception:
            pass


def start_pipeline_background(project_id: str, llm_provider: str) -> bool:
    """Start the analysis pipeline as a decoupled background task.

    Args:
        project_id: The project ID to analyze.
        llm_provider: Primary LLM provider.

    Returns:
        True if task started, False if already running.
    """
    if is_pipeline_running(project_id):
        return False

    async def _runner():
        try:
            async for event_json in run_pipeline(project_id, llm_provider):
                _broadcast_event(project_id, event_json)
        except Exception as e:
            logger.error(f"Background pipeline execution failed for project {project_id}: {e}")
        finally:
            _running_tasks.pop(project_id, None)

    task = asyncio.create_task(_runner())
    _running_tasks[project_id] = task
    return True


def _emit_event(stage: str, status: str, message: str = "", progress: int = 0) -> str:
    """Create an SSE event string.

    Args:
        stage: Current pipeline stage.
        status: Stage status (pending, running, complete, error).
        message: Optional descriptive message.
        progress: Stage number (1-5).

    Returns:
        JSON-serialized PipelineEvent.
    """
    event = PipelineEvent(
        stage=stage,
        status=status,
        message=message,
        progress=progress,
        total_stages=len(PIPELINE_STAGES_ORDERED),
    )
    return event.model_dump_json()


async def run_pipeline(
    project_id: str,
    llm_provider: str,
) -> AsyncGenerator[str, None]:
    """Run the full 5-stage analysis pipeline with SSE event emission.

    Args:
        project_id: The project to analyze.
        llm_provider: Primary LLM provider to use.

    Yields:
        SSE event strings for each pipeline stage transition.
    """
    conn = get_connection()

    try:
        # Update project status to analyzing
        conn.execute(
            "UPDATE projects SET status = 'analyzing', updated_at = ? WHERE id = ?",
            (datetime.now(timezone.utc).isoformat(), project_id),
        )
        conn.commit()

        # --- Stage 1: Ingest ---
        yield _emit_event(PipelineStage.INGEST, PipelineStageStatus.RUNNING, "Extracting text from uploaded files...", 1)

        inputs = conn.execute(
            "SELECT id, type, filename, file_path FROM inputs WHERE project_id = ?",
            (project_id,),
        ).fetchall()

        if not inputs:
            yield _emit_event(PipelineStage.INGEST, PipelineStageStatus.ERROR, "No inputs found for this project")
            conn.execute(
                "UPDATE projects SET status = 'error', updated_at = ? WHERE id = ?",
                (datetime.now(timezone.utc).isoformat(), project_id),
            )
            conn.commit()
            return

        input_texts: dict[str, str] = {}
        for inp in inputs:
            inp_dict = dict(inp)
            input_id = inp_dict["id"]
            input_type = InputType(inp_dict["type"])
            file_path = inp_dict["file_path"]

            if input_type == InputType.URL:
                text = await extract_url(file_path)  # file_path stores URL for URL type
            else:
                text = await extract_text(file_path, input_type)

            input_texts[input_id] = text

            # Save extracted text to database
            conn.execute(
                "UPDATE inputs SET raw_text = ?, extracted_at = ? WHERE id = ?",
                (text, datetime.now(timezone.utc).isoformat(), input_id),
            )
            conn.commit()

        yield _emit_event(PipelineStage.INGEST, PipelineStageStatus.COMPLETE, f"Extracted text from {len(inputs)} files", 1)

        # Build combined context for LLM
        combined_text = _build_combined_context(inputs, input_texts)

        # --- Stage 2: Extract (Discovery) ---
        yield _emit_event(PipelineStage.EXTRACT, PipelineStageStatus.RUNNING, "Analyzing business needs...", 2)

        discovery = await _run_extract_stage(combined_text, list(input_texts.keys()), llm_provider)

        # Save discovery to database
        _save_discovery(conn, project_id, discovery)

        yield _emit_event(PipelineStage.EXTRACT, PipelineStageStatus.COMPLETE, "Business understanding extracted", 2)

        # --- Stage 3: Synthesize (Improvements) ---
        yield _emit_event(PipelineStage.SYNTHESIZE, PipelineStageStatus.RUNNING, "Generating improvement suggestions...", 3)

        synthesis = await _run_synthesize_stage(discovery, llm_provider)

        # Save to solutions table (improvements only, features etc. come in outline)
        yield _emit_event(PipelineStage.SYNTHESIZE, PipelineStageStatus.COMPLETE, f"Generated {len(synthesis.improvements)} improvements", 3)

        # --- Stage 4: Outline (Solution) ---
        yield _emit_event(PipelineStage.OUTLINE, PipelineStageStatus.RUNNING, "Creating solution outline...", 4)

        outline = await _run_outline_stage(discovery, synthesis, llm_provider)

        # Save full solution
        _save_solution(conn, project_id, synthesis, outline)

        yield _emit_event(PipelineStage.OUTLINE, PipelineStageStatus.COMPLETE, f"Outlined {len(outline.features)} features", 4)

        # --- Stage 5: Generate POC ---
        yield _emit_event(PipelineStage.POC, PipelineStageStatus.RUNNING, "Generating POC application...", 5)

        discovery_summary = _format_discovery_summary(discovery)
        solution_summary = _format_solution_summary(synthesis, outline)

        description, html_content = await generate_poc_html(
            discovery_summary,
            solution_summary,
            llm_provider,
            reference_context=combined_text,
        )

        # Save POC to filesystem
        poc_path = _save_poc_file(project_id, html_content)
        _save_poc_record(conn, project_id, description, str(poc_path))

        # Update project status to completed
        conn.execute(
            "UPDATE projects SET status = 'completed', updated_at = ? WHERE id = ?",
            (datetime.now(timezone.utc).isoformat(), project_id),
        )
        conn.commit()

        yield _emit_event(PipelineStage.POC, PipelineStageStatus.COMPLETE, "POC generated successfully", 5)

    except Exception as e:
        logger.error(f"Pipeline error for project {project_id}: {e}")
        conn.execute(
            "UPDATE projects SET status = 'error', updated_at = ? WHERE id = ?",
            (datetime.now(timezone.utc).isoformat(), project_id),
        )
        conn.commit()
        yield _emit_event("error", PipelineStageStatus.ERROR, str(e))
    finally:
        conn.close()


def _build_combined_context(inputs: list, input_texts: dict[str, str]) -> str:
    """Build combined text context from all inputs for LLM processing.

    Args:
        inputs: List of input database rows.
        input_texts: Map of input ID to extracted text.

    Returns:
        Formatted combined context string.
    """
    parts: list[str] = []
    for inp in inputs:
        inp_dict = dict(inp)
        input_id = inp_dict["id"]
        filename = inp_dict["filename"]
        input_type = inp_dict["type"]
        text = input_texts.get(input_id, "")

        parts.append(
            f"=== INPUT [{input_id}] — {filename} (type: {input_type}) ===\n{text}\n"
        )

    return "\n".join(parts)


async def _run_extract_stage(
    combined_text: str,
    input_ids: list[str],
    llm_provider: str,
) -> DiscoveryOutput:
    """Run the Extract stage - derive business understanding from inputs.

    Args:
        combined_text: Combined text from all inputs.
        input_ids: List of input IDs for traceability.
        llm_provider: LLM provider to use.

    Returns:
        Structured DiscoveryOutput.
    """
    prompt = f"""You are a business consultant analyzing scattered client inputs to understand their business needs.

Analyze ALL the following inputs carefully and extract a structured understanding:

{combined_text}

## Instructions:
1. Identify the client's MAIN GOAL - what they are ultimately trying to achieve
2. Describe the CURRENT PROCESS - how things work today based on the inputs
3. List all PAIN POINTS (explicit and implicit problems). For each, reference which input IDs it was derived from using the IDs shown in brackets (e.g., the input IDs like the ones shown in the [INPUT_ID] markers above)
4. List KEY REQUIREMENTS that the solution must satisfy. Reference source input IDs.
5. Identify GAPS - what information is missing, unclear, or contradictory

Available input IDs: {input_ids}

Be thorough and specific. Ground everything in the actual input content - do not make generic suggestions."""

    return await invoke_with_structured_output(prompt, DiscoveryOutput, llm_provider)


async def _run_synthesize_stage(
    discovery: DiscoveryOutput,
    llm_provider: str,
) -> SynthesisOutput:
    """Run the Synthesize stage - generate improvement suggestions.

    Args:
        discovery: Output from the Extract stage.
        llm_provider: LLM provider to use.

    Returns:
        Structured SynthesisOutput.
    """
    pain_points_text = "\n".join(
        f"- [{pp.id}] {pp.description}" for pp in discovery.pain_points
    )

    prompt = f"""You are a business consultant proposing process improvements.

## Current Situation:
- Goal: {discovery.main_goal}
- Current Process: {discovery.current_process}

## Identified Pain Points:
{pain_points_text}

## Instructions:
Generate PRACTICAL and SPECIFIC improvement suggestions. Each improvement MUST:
1. Be directly linked to one or more specific pain point IDs listed above
2. Be actionable and specific to this business context (NOT generic advice like "use AI")
3. Clearly explain what changes and how it helps

Suggest 4-8 improvements that address the most critical pain points."""

    return await invoke_with_structured_output(prompt, SynthesisOutput, llm_provider)


async def _run_outline_stage(
    discovery: DiscoveryOutput,
    synthesis: SynthesisOutput,
    llm_provider: str,
) -> OutlineOutput:
    """Run the Outline stage - generate solution architecture.

    Args:
        discovery: Output from the Extract stage.
        synthesis: Output from the Synthesize stage.
        llm_provider: LLM provider to use.

    Returns:
        Structured OutlineOutput.
    """
    improvements_text = "\n".join(
        f"- [{imp.id}] {imp.description}" for imp in synthesis.improvements
    )

    prompt = f"""You are a solution architect designing an application based on business analysis.

## Business Context:
- Goal: {discovery.main_goal}
- Current Process: {discovery.current_process}

## Proposed Improvements:
{improvements_text}

## Requirements:
{chr(10).join(f"- {req.description}" for req in discovery.requirements)}

## Instructions:
Design a practical application solution with:
1. FEATURES: 5-8 core features that implement the proposed improvements
2. USER ROLES: The different types of users who will use the system
3. SCREENS: The main screens or modules needed
4. FLOW: Step-by-step flow of how the application works (6-10 steps)

Be specific and practical. Each element should clearly serve the business goal."""

    return await invoke_with_structured_output(prompt, OutlineOutput, llm_provider)


def _save_discovery(conn, project_id: str, discovery: DiscoveryOutput) -> None:
    """Save discovery results to database."""
    # Ensure unique item IDs
    seen_pp: set[str] = set()
    for i, pp in enumerate(discovery.pain_points):
        if not pp.id or pp.id in seen_pp:
            pp.id = f"pp-{i+1}"
        seen_pp.add(pp.id)

    seen_req: set[str] = set()
    for i, req in enumerate(discovery.requirements):
        if not req.id or req.id in seen_req:
            req.id = f"req-{i+1}"
        seen_req.add(req.id)

    seen_gap: set[str] = set()
    for i, gap in enumerate(discovery.gaps):
        if not gap.id or gap.id in seen_gap:
            gap.id = f"gap-{i+1}"
        seen_gap.add(gap.id)

    # Delete existing discovery for this project (re-analysis)
    conn.execute("DELETE FROM discoveries WHERE project_id = ?", (project_id,))

    conn.execute(
        """INSERT INTO discoveries (id, project_id, main_goal, current_process,
           pain_points, requirements, gaps, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            str(uuid.uuid4()),
            project_id,
            discovery.main_goal,
            discovery.current_process,
            json.dumps([pp.model_dump() for pp in discovery.pain_points]),
            json.dumps([req.model_dump() for req in discovery.requirements]),
            json.dumps([gap.model_dump() for gap in discovery.gaps]),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()


def _save_solution(conn, project_id: str, synthesis: SynthesisOutput, outline: OutlineOutput) -> None:
    """Save solution results to database."""
    seen_imp: set[str] = set()
    for i, imp in enumerate(synthesis.improvements):
        if not imp.id or imp.id in seen_imp:
            imp.id = f"imp-{i+1}"
        seen_imp.add(imp.id)

    seen_feat: set[str] = set()
    for i, feat in enumerate(outline.features):
        if not feat.id or feat.id in seen_feat:
            feat.id = f"feat-{i+1}"
        seen_feat.add(feat.id)

    seen_role: set[str] = set()
    for i, role in enumerate(outline.user_roles):
        if not role.id or role.id in seen_role:
            role.id = f"role-{i+1}"
        seen_role.add(role.id)

    seen_scr: set[str] = set()
    for i, scr in enumerate(outline.screens):
        if not scr.id or scr.id in seen_scr:
            scr.id = f"scr-{i+1}"
        seen_scr.add(scr.id)

    # Delete existing solution for this project
    conn.execute("DELETE FROM solutions WHERE project_id = ?", (project_id,))

    conn.execute(
        """INSERT INTO solutions (id, project_id, improvements, features,
           user_roles, screens, flow_steps, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            str(uuid.uuid4()),
            project_id,
            json.dumps([imp.model_dump() for imp in synthesis.improvements]),
            json.dumps([feat.model_dump() for feat in outline.features]),
            json.dumps([role.model_dump() for role in outline.user_roles]),
            json.dumps([scr.model_dump() for scr in outline.screens]),
            json.dumps([step.model_dump() for step in outline.flow_steps]),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()


def _save_poc_file(project_id: str, html_content: str) -> Path:
    """Save generated POC HTML to filesystem.

    Args:
        project_id: The project ID.
        html_content: The HTML content to save.

    Returns:
        Path to the saved file.
    """
    GENERATED_POCS_DIR.mkdir(parents=True, exist_ok=True)
    poc_path = GENERATED_POCS_DIR / f"{project_id}.html"
    poc_path.write_text(html_content, encoding="utf-8")
    logger.info(f"POC saved to {poc_path}")
    return poc_path


def _save_poc_record(conn, project_id: str, description: str, artifact_path: str) -> None:
    """Save POC metadata to database."""
    conn.execute("DELETE FROM pocs WHERE project_id = ?", (project_id,))

    conn.execute(
        """INSERT INTO pocs (id, project_id, description, artifact_path, generated_at)
           VALUES (?, ?, ?, ?, ?)""",
        (
            str(uuid.uuid4()),
            project_id,
            description,
            artifact_path,
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()


def _format_discovery_summary(discovery: DiscoveryOutput) -> str:
    """Format discovery output as a text summary for POC generation."""
    pain_points = "\n".join(f"- {pp.description}" for pp in discovery.pain_points)
    return f"""Main Goal: {discovery.main_goal}
Current Process: {discovery.current_process}
Pain Points:
{pain_points}"""


def _format_solution_summary(synthesis: SynthesisOutput, outline: OutlineOutput) -> str:
    """Format solution output as a text summary for POC generation."""
    improvements = "\n".join(f"- {imp.description}" for imp in synthesis.improvements)
    features = "\n".join(f"- {f.name}: {f.description}" for f in outline.features)
    roles = "\n".join(f"- {r.name}: {r.description}" for r in outline.user_roles)
    screens = "\n".join(f"- {s.name}: {s.description}" for s in outline.screens)
    flow = "\n".join(f"{s.step_number}. {s.description}" for s in outline.flow_steps)

    return f"""Proposed Improvements:
{improvements}

Features:
{features}

User Roles:
{roles}

Screens:
{screens}

Application Flow:
{flow}"""
