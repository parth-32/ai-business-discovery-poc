"""Pydantic models for LLM structured output.

These models are used with LangChain's `with_structured_output(method="json_schema")`
to enforce type-safe responses from the LLM.
"""

from pydantic import BaseModel, Field


# --- Stage 2: Extract (Discovery) ---


class PainPoint(BaseModel):
    """A specific pain point identified from the client inputs."""

    id: str = Field(description="Unique identifier for this pain point (e.g., 'pp-1')")
    description: str = Field(description="Clear description of the pain point")
    source_input_ids: list[str] = Field(
        description="IDs of the input files this pain point was derived from"
    )


class Requirement(BaseModel):
    """A key requirement extracted from the client inputs."""

    id: str = Field(description="Unique identifier for this requirement (e.g., 'req-1')")
    description: str = Field(description="Clear description of the requirement")
    source_input_ids: list[str] = Field(
        description="IDs of the input files this requirement was derived from"
    )


class Gap(BaseModel):
    """Missing or unclear information identified across inputs."""

    id: str = Field(description="Unique identifier for this gap (e.g., 'gap-1')")
    description: str = Field(description="Description of what's missing or unclear")


class DiscoveryOutput(BaseModel):
    """Structured output from the Extract stage - business understanding."""

    main_goal: str = Field(
        description="The client's primary goal - what they are ultimately trying to achieve"
    )
    current_process: str = Field(
        description="How things work today, reconstructed from the scattered inputs"
    )
    pain_points: list[PainPoint] = Field(
        description="Explicit and implicit problems in the current process"
    )
    requirements: list[Requirement] = Field(
        description="What the solution must satisfy"
    )
    gaps: list[Gap] = Field(
        description="Missing or contradictory information across inputs"
    )


# --- Stage 3: Synthesize (Improvements) ---


class Improvement(BaseModel):
    """A specific process improvement suggestion."""

    id: str = Field(description="Unique identifier for this improvement (e.g., 'imp-1')")
    description: str = Field(description="Practical, specific improvement suggestion")
    related_pain_point_ids: list[str] = Field(
        description="IDs of pain points this improvement addresses"
    )


class SynthesisOutput(BaseModel):
    """Structured output from the Synthesize stage - improvement suggestions."""

    improvements: list[Improvement] = Field(
        description="Process improvements mapped to specific pain points"
    )


# --- Stage 4: Outline (Solution) ---


class Feature(BaseModel):
    """A proposed feature for the solution."""

    id: str = Field(description="Unique identifier for this feature (e.g., 'feat-1')")
    name: str = Field(description="Short name of the feature")
    description: str = Field(description="What the feature does")


class UserRole(BaseModel):
    """A user role in the proposed solution."""

    id: str = Field(description="Unique identifier for this role (e.g., 'role-1')")
    name: str = Field(description="Name of the role (e.g., 'Admin', 'Driver')")
    description: str = Field(description="What this role does in the system")


class Screen(BaseModel):
    """A screen or module in the proposed solution."""

    id: str = Field(description="Unique identifier for this screen (e.g., 'scr-1')")
    name: str = Field(description="Name of the screen or module")
    description: str = Field(description="What this screen shows or allows")


class FlowStep(BaseModel):
    """A step in the application flow."""

    step_number: int = Field(description="Order of this step in the flow")
    description: str = Field(description="What happens at this step")


class OutlineOutput(BaseModel):
    """Structured output from the Outline stage - solution architecture."""

    features: list[Feature] = Field(description="Proposed features for the solution")
    user_roles: list[UserRole] = Field(description="User roles in the system")
    screens: list[Screen] = Field(description="Screens or modules in the application")
    flow_steps: list[FlowStep] = Field(
        description="Step-by-step flow of how the application works"
    )


# --- Stage 5: POC Generation ---


class PocOutput(BaseModel):
    """Structured output from the POC generation stage."""

    title: str = Field(description="Title of the POC application")
    description: str = Field(description="Brief description of what the POC demonstrates")
    html_content: str = Field(
        description="Complete self-contained HTML file content including embedded CSS and JavaScript"
    )
