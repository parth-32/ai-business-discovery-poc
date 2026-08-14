"""Pydantic schemas for API request/response models."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.llm_outputs import (
    PainPoint,
    Requirement,
    Gap,
    Improvement,
    Feature,
    UserRole,
    Screen,
    FlowStep,
)


# --- Request Schemas ---


class ProjectCreate(BaseModel):
    """Request body for creating a new project."""

    name: str = Field(min_length=1, max_length=200, description="Project name")


class UrlInput(BaseModel):
    """Request body for adding a URL input."""

    url: str = Field(description="URL to scrape for content")


class SettingsUpdate(BaseModel):
    """Request body for updating settings."""

    llm_provider: str = Field(description="LLM provider: 'gemini' or 'ollama'")


class AnalysisRequest(BaseModel):
    """Request body for triggering analysis."""

    llm_provider: str | None = Field(
        default=None, description="Override LLM provider for this analysis"
    )


# --- Response Schemas ---


class InputResponse(BaseModel):
    """Response schema for a single input."""

    id: str
    project_id: str
    type: str
    filename: str
    raw_text: str | None = None
    file_path: str | None = None
    extracted_at: str | None = None


class DiscoveryResponse(BaseModel):
    """Response schema for discovery results."""

    id: str
    project_id: str
    main_goal: str
    current_process: str
    pain_points: list[PainPoint]
    requirements: list[Requirement]
    gaps: list[Gap]
    created_at: str


class SolutionResponse(BaseModel):
    """Response schema for solution outline."""

    id: str
    project_id: str
    improvements: list[Improvement]
    features: list[Feature]
    user_roles: list[UserRole]
    screens: list[Screen]
    flow_steps: list[FlowStep]
    created_at: str


class PocResponse(BaseModel):
    """Response schema for POC metadata."""

    id: str
    project_id: str
    description: str
    artifact_path: str
    generated_at: str


class ProjectResponse(BaseModel):
    """Response schema for a project with all nested data."""

    id: str
    name: str
    status: str
    created_at: str
    updated_at: str
    inputs: list[InputResponse] = []
    discovery: DiscoveryResponse | None = None
    solution: SolutionResponse | None = None
    poc: PocResponse | None = None


class ProjectListResponse(BaseModel):
    """Response schema for listing projects."""

    id: str
    name: str
    status: str
    created_at: str
    updated_at: str
    input_count: int = 0


class SampleScenario(BaseModel):
    """Response schema for a sample data scenario."""

    id: str
    name: str
    description: str
    file_count: int


class SettingsResponse(BaseModel):
    """Response schema for settings."""

    llm_provider: str
    gemini_available: bool
    ollama_available: bool


class PipelineEvent(BaseModel):
    """SSE event for pipeline progress."""

    stage: str
    status: str
    message: str = ""
    progress: int = 0
    total_stages: int = 5
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
