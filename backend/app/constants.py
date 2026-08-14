"""Constants - single source of truth for enums, statuses, and static configuration."""

from enum import StrEnum


class ProjectStatus(StrEnum):
    """Project lifecycle statuses."""

    CREATED = "created"
    UPLOADING = "uploading"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    ERROR = "error"


class InputType(StrEnum):
    """Supported input file types."""

    PDF = "pdf"
    IMAGE = "image"
    TRANSCRIPT = "transcript"
    CHAT = "chat"
    DOCX = "docx"
    URL = "url"


class PipelineStage(StrEnum):
    """Pipeline processing stages."""

    INGEST = "ingest"
    EXTRACT = "extract"
    SYNTHESIZE = "synthesize"
    OUTLINE = "outline"
    POC = "poc"


class PipelineStageStatus(StrEnum):
    """Status of an individual pipeline stage."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    ERROR = "error"


class LLMProvider(StrEnum):
    """Supported LLM providers."""

    GEMINI = "gemini"
    OLLAMA = "ollama"


# File extension to input type mapping
EXTENSION_TO_INPUT_TYPE: dict[str, InputType] = {
    ".pdf": InputType.PDF,
    ".png": InputType.IMAGE,
    ".jpg": InputType.IMAGE,
    ".jpeg": InputType.IMAGE,
    ".webp": InputType.IMAGE,
    ".bmp": InputType.IMAGE,
    ".tiff": InputType.IMAGE,
    ".tif": InputType.IMAGE,
    ".txt": InputType.TRANSCRIPT,
    ".md": InputType.TRANSCRIPT,
    ".docx": InputType.DOCX,
}

# MIME type to input type mapping
MIME_TO_INPUT_TYPE: dict[str, InputType] = {
    "application/pdf": InputType.PDF,
    "image/png": InputType.IMAGE,
    "image/jpeg": InputType.IMAGE,
    "image/webp": InputType.IMAGE,
    "image/bmp": InputType.IMAGE,
    "image/tiff": InputType.IMAGE,
    "text/plain": InputType.TRANSCRIPT,
    "text/markdown": InputType.TRANSCRIPT,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": InputType.DOCX,
}

# Pipeline stages in execution order
PIPELINE_STAGES_ORDERED: list[PipelineStage] = [
    PipelineStage.INGEST,
    PipelineStage.EXTRACT,
    PipelineStage.SYNTHESIZE,
    PipelineStage.OUTLINE,
    PipelineStage.POC,
]

# Available sample data scenarios
SAMPLE_SCENARIOS: dict[str, str] = {
    "logistics": "QuickShip Logistics",
    "clinic": "Bright Smile Dental Clinic",
    "restaurant": "Bella Cucina Restaurant",
}
