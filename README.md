# AI Business Discovery → POC Generator

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.3+-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![LangChain](https://img.shields.io/badge/LangChain-0.3+-1C3C3C.svg?logo=langchain&logoColor=white)](https://python.langchain.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB.svg?logo=python&logoColor=white)](https://python.org)

An intelligent, full-stack application that simulates a senior AI consultant's workflow: ingesting messy, heterogeneous client inputs (meeting transcripts, WhatsApp chat exports, process SOPs, screenshots, and website URLs), synthesizing underlying business needs with strict source traceability, identifying pain points, suggesting grounded process improvements, producing an actionable solution outline, and automatically generating an interactive, runnable, single-file HTML POC prototype.

---

## Table of Contents

- [Executive Summary & Approach](#executive-summary--approach)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Multi-Stage Discovery Pipeline](#multi-stage-discovery-pipeline)
- [Project Directory Structure](#project-directory-structure)
- [Quick Start Guide](#quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Verification & Testing](#verification--testing)
  - [Running Automated Tests](#running-automated-tests)
  - [End-to-End Walkthrough](#end-to-end-walkthrough)
- [Pre-Configured Client Scenarios](#pre-configured-client-scenarios)
- [Assumptions & Scope Boundaries](#assumptions--scope-boundaries)
- [Environment Variables Reference](#environment-variables-reference)

---

## Executive Summary & Approach

In real-world enterprise consulting, requirements never arrive in a clean, unified document. Instead, they are scattered across fragmented call transcripts, WhatsApp exports, PDF SOPs, workflow screenshots, and reference URLs.

This platform automates the end-to-end discovery and prototyping workflow:

```
[ Messy Client Inputs ] 
  ├── Meeting Transcripts / Notes
  ├── WhatsApp / Chat Logs
  ├── PDF / Word SOP Documents
  ├── Workflow Screenshots (OCR)
  └── Reference URLs (Web Scraping)
          │
          ▼
[ 1. Ingestion Engine ] ────────► Extraction & Text Normalization per Input Type
          │
          ▼
[ 2. Business Extraction ] ─────► Main Goal, Current Process, Traceable Pain Points, Gaps
          │
          ▼
[ 3. Process Synthesis ] ───────► Pragmatic Improvements Mapped to Pain Point IDs
          │
          ▼
[ 4. Solution Outline ] ────────► User Roles, Features, Modules, Mermaid.js Workflow
          │
          ▼
[ 5. POC Generator ] ───────────► Standalone, Runnable Interactive HTML/CSS/JS Prototype
```

### Core Design Principles

1. **Strict Source Traceability**: Every identified pain point and requirement references the source input file ID, preventing hallucinated conclusions and providing transparent audits.
2. **Surfacing Gaps vs. Guessing**: Contradictions, missing data, and unclear parameters across inputs are explicitly highlighted as Information Gaps rather than silently filled by the LLM.
3. **Structured & Type-Safe Output**: All LLM stages use schema-constrained JSON output parsing (`with_structured_output(method="json_schema")`), ensuring reliable backend serialization and frontend type safety.
4. **Resilient Multi-Provider Fallback**: Seamless primary/fallback architecture supporting cloud providers (Google Gemini) and local offline LLMs (Ollama) with non-blocking async execution.
5. **Zero-Friction Prototype Delivery**: The generated POC is a standalone, self-contained HTML/CSS/JS application that can be tested in an embedded sandboxed iframe or downloaded directly as a single file.

---

## Key Architectural Decisions

### Backend: FastAPI & Python 3.12
- **Asynchronous Pipeline Execution**: Non-blocking I/O with `asyncio` and `asyncio.to_thread` for LLM generation and document parsing.
- **Real-Time Streaming**: Server-Sent Events (SSE) via `EventSourceResponse` stream granular progress updates, logs, and stage completion events to the client.
- **Lightweight Persistence**: SQLite with thread-safe connection pooling and automatic schema initialization, avoiding unnecessary database server dependencies for rapid local setup.
- **Robust Ingestion Suite**: 
  - `pypdf` for PDF parsing
  - `python-docx` for Word documents
  - `pytesseract` / `Pillow` for OCR on screenshots and diagrams
  - `beautifulsoup4` + `httpx` for web page content extraction

### Frontend: Next.js 15 (App Router) & TypeScript
- **Strict Typing**: End-to-end type safety with zero `any` types and Zod schemas validating API responses.
- **Modern Styling**: Tailwind CSS v4 CSS-first configuration, delivering a modern, accessible, dark-mode-ready aesthetic.
- **State Management**:
  - **TanStack Query (v5)**: Declarative server state management, automated cache invalidation, and query deduplication.
  - **Zustand**: Client-side state for active pipeline progress, tab selection, and dynamic LLM provider toggles.
- **Interactive Visualizations**: Client-side rendering of dynamic process workflow diagrams using **Mermaid.js**.
- **Sandboxed Interactive Preview**: Safe iframe container with direct HTML blob rendering and full-screen / export support.

### LLM Provider Engine: LangChain Multi-Model Architecture
- **Primary Model**: Google Gemini (`ChatGoogleGenerativeAI`, e.g., `gemini-2.0-flash` or `gemma-4-26b-a4b-it`).
- **Local Fallback**: Local Ollama instance (`ChatOllama`, e.g., `llama3.2:1b` or `qwen2.5:7b-instruct`).
- **Automatic Fallback Handler**: If the primary provider fails, hits rate limits, or is unreachable, the request automatically falls back to the secondary provider without breaking the pipeline.

---

## Multi-Stage Discovery Pipeline

| Stage | Name | Description | Output Artifacts |
|:---|:---|:---|:---|
| **Stage 1** | **Ingestion** | Ingests and extracts clean text from PDFs, DOCX files, raw transcripts, chat logs, OCR images, and live URLs. | Normalized text records with metadata and input IDs. |
| **Stage 2** | **Extraction** | Synthesizes core business objectives, step-by-step current process, pain points with source citations, and missing information gaps. | `BusinessDiscovery` (Goal, Process, Pain Points, Requirements, Gaps). |
| **Stage 3** | **Synthesis** | Formulates concrete, grounded process improvements (automate, simplify, eliminate) mapped 1:1 to pain point IDs. | `ProcessImprovementPlan` (Grounded improvements with rationale). |
| **Stage 4** | **Outline** | Structures the software solution: core features, target user personas, UI screens/modules, and Mermaid-compatible workflow steps. | `SolutionOutline` (Features, Roles, Screens, Workflow Steps). |
| **Stage 5** | **POC Generation** | Generates a complete, interactive single-file HTML/CSS/JS application that brings the solution outline to life. | Runnable `.html` file saved to disk and served live. |

---

## Project Directory Structure

```
ai-business-discovery-poc/
├── backend/                         # FastAPI application & AI services
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                # Environment configuration & settings
│   │   ├── constants.py             # Enums: input types, pipeline stages, providers
│   │   ├── database.py              # SQLite schema, migrations & CRUD helpers
│   │   ├── main.py                  # FastAPI entry point, CORS & router registration
│   │   ├── models/
│   │   │   ├── llm_outputs.py       # Pydantic schemas for structured LLM synthesis
│   │   │   └── schemas.py           # REST API request & response schemas
│   │   ├── routers/
│   │   │   ├── analysis.py          # Discovery, solution, pipeline run & SSE stream
│   │   │   ├── app_settings.py      # LLM provider health & configuration API
│   │   │   ├── inputs.py            # File upload, text input & URL scraping endpoints
│   │   │   ├── poc.py               # POC HTML retrieval, download & regeneration
│   │   │   └── projects.py          # Project management & sample scenario loader
│   │   └── services/
│   │       ├── ingestion.py         # Multi-format parsing (PDF, DOCX, OCR, Web)
│   │       ├── llm.py               # LangChain Gemini & Ollama integration with fallback
│   │       ├── pipeline.py          # 5-stage async discovery pipeline orchestrator
│   │       └── poc_generator.py     # HTML prototype prompt generation & post-processing
│   ├── sample_data/                 # Pre-configured scenario datasets
│   │   ├── clinic/                  # Dental clinic booking & triage scenario
│   │   ├── logistics/               # Freight dispatch & exception handling scenario
│   │   └── restaurant/              # Restaurant inventory & supplier ordering scenario
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py              # Pytest integration test suite
│   ├── requirements.txt             # Pinned backend dependencies
│   └── .env.example                 # Template environment variables file
└── frontend/                        # Next.js 15 TypeScript web application
    ├── app/
    │   ├── globals.css              # Tailwind CSS v4 design system tokens
    │   ├── layout.tsx               # Root layout with QueryClient & theme providers
    │   ├── page.tsx                 # Project selection & sample scenario dashboard
    │   └── projects/[id]/page.tsx   # Workspace page (Inputs, Pipeline, Discovery, Solution, POC)
    ├── components/
    │   ├── discovery/               # Business discovery rendering (Goals, Pain Points, Gaps)
    │   ├── home/                    # Project creation modal & sample dataset cards
    │   ├── inputs/                  # Multi-type file uploader, URL scraper, text paste modal
    │   ├── pipeline/                # Real-time SSE stage progress stepper & execution logs
    │   ├── poc/                     # Sandboxed iframe preview, code viewer & download button
    │   ├── settings/                # LLM provider switcher & health indicators
    │   ├── solution/                # Improvements, features, screens & Mermaid workflow
    │   └── ui/                      # Reusable UI primitives (Buttons, Badges, Tabs, Cards, Dialogs)
    ├── lib/
    │   ├── api.ts                   # Type-safe Fetch API client for backend routes
    │   ├── constants.ts             # UI constants and status mappings
    │   ├── schemas.ts               # Zod validation schemas matching backend types
    │   ├── types.ts                 # Full TypeScript type definitions
    │   └── utils.ts                 # Utility functions (formatting, class merging)
    ├── providers/
    │   └── query-provider.tsx       # TanStack QueryClient provider wrapper
    ├── stores/
    │   └── ui-store.ts              # Zustand client state store
    ├── package.json
    ├── tsconfig.json
    └── next.config.ts
```

---

## Quick Start Guide

### Prerequisites

Ensure the following tools are installed on your system:
- **Python**: 3.12+
- **Node.js**: 20.x or higher & **npm** 10.x+
- **Tesseract OCR** (for image OCR support):
  - **macOS**: `brew install tesseract`
  - **Ubuntu/Debian**: `sudo apt-get install -y tesseract-ocr`
  - **Windows**: [UB-Mannheim Tesseract installer](https://github.com/UB-Mannheim/tesseract/wiki)
- **Ollama** *(Optional, for offline fallback)*: [Install Ollama](https://ollama.ai) and run `ollama run llama3.2:1b` or `ollama run qwen2.5:7b-instruct`.

---

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   # On Windows: venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure your Google Gemini API key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.0-flash
   DEFAULT_LLM_PROVIDER=gemini
   ```
   *(Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey))*.

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

The backend server will start at `http://localhost:8000`. You can inspect interactive OpenAPI documentation at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Verification & Testing

### Running Automated Tests

#### Backend Integration Tests
Run pytest to verify REST endpoints, database persistence, and sample scenario loading:
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

#### Frontend Type Checking & Build
Run TypeScript compilation and production build validation:
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

### End-to-End Walkthrough

1. **Dashboard**: Navigate to `http://localhost:3000`.
2. **Load Scenario or Create Project**:
   - Click **"QuickShip Logistics"** (or another sample scenario) to instantly initialize a project populated with heterogeneous real-world artifacts (meeting transcripts, WhatsApp chat logs, and SOP documents).
   - *Or* click **"+ New Project"** to create a custom project and upload your own PDFs, Word docs, images, or enter a reference website URL.
3. **Run Discovery Pipeline**:
   - Click the **"Run AI Pipeline"** button in the header.
   - Watch the real-time Server-Sent Events (SSE) stepper execute Stage 1 through Stage 5 with live logs.
4. **Inspect Business Discovery**:
   - Switch to the **"Business Discovery"** tab to review the synthesized overarching goal, step-by-step current process, pain points with source citations, key requirements, and highlighted information gaps.
5. **Inspect Solution Outline**:
   - Switch to the **"Solution Outline"** tab to review grounded process improvements, target user roles, proposed modules, and the interactive **Mermaid.js workflow diagram**.
6. **Interact with the POC**:
   - Switch to the **"Working POC Application"** tab.
   - Test the generated, interactive prototype directly inside the embedded sandboxed preview.
   - Click **"Download HTML"** to save the standalone single-file application locally.

---

## Pre-Configured Client Scenarios

The backend includes 3 complete, realistic client datasets in `backend/sample_data/` to test varied business domains:

1. **QuickShip Logistics (Freight & Dispatch)**:
   - *Inputs*: Operations manager call transcript, driver WhatsApp dispatch chat log, and internal exception-handling SOP document.
   - *Focus*: Reducing manual phone dispatch delays, automated exception routing, and real-time shipment status dashboards.
2. **BrightSmile Dental Clinic (Patient Care & Triage)**:
   - *Inputs*: Receptionist intake notes, WhatsApp appointment booking logs, and dental emergency triage protocol PDF.
   - *Focus*: Intelligent emergency triage, automated appointment rescheduling, and digital intake forms.
3. **Artisan Trattoria (Restaurant Inventory & Ordering)**:
   - *Inputs*: Head chef voice transcript, supplier order WhatsApp chat, and stock audit spreadsheet / SOP.
   - *Focus*: Dynamic ingredient par-level alerts, consolidated supplier purchase orders, and waste tracking.

---

## Assumptions & Scope Boundaries

In accordance with the assignment specification:

- **Authentication & Multi-Tenancy**: Omitted per assignment guidelines to focus strictly on discovery synthesis and POC generation capabilities.
- **Third-Party Live Integrations**: Live API hooks (e.g., active Microsoft Teams or WhatsApp Business webhooks) are replaced with file uploads and text exports.
- **Single-File POC Output**: Generated POCs are self-contained HTML/CSS/JS applications with in-memory state and mock data, designed for rapid validation without requiring additional server deployments.
- **LLM Context Management**: Ingested documents are sanitized and trimmed to stay comfortably within the context windows of cloud and local models.

---

## Environment Variables Reference

| Variable | Default | Description |
|:---|:---|:---|
| `GEMINI_API_KEY` | `""` | Google Gemini API key from AI Studio *(Required for Gemini)* |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model name (e.g., `gemini-2.0-flash`, `gemini-1.5-pro`) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama local endpoint URL |
| `OLLAMA_MODEL` | `llama3.2:1b` | Local Ollama model identifier (e.g., `llama3.2:1b`, `qwen2.5:7b-instruct`) |
| `DEFAULT_LLM_PROVIDER` | `gemini` | Primary LLM provider (`gemini` or `ollama`) |
| `HOST` | `0.0.0.0` | Backend bind host |
| `PORT` | `8000` | Backend port |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin for frontend |
| `MAX_FILE_SIZE_MB` | `10` | Maximum upload size per input file in megabytes |
| `DATABASE_URL` | `sqlite:///./app.db` | SQLite database connection string |
