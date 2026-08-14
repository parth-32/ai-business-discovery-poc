# AI Business Discovery → POC Generator

A full-stack application that simulates a senior AI consultant's workflow: taking scattered client inputs (meeting transcripts, WhatsApp chat exports, process SOP documents, screenshots, website URLs), synthesizing the underlying business needs with strict traceability, identifying pain points, suggesting grounded process improvements, producing a solution outline, and generating a runnable, single-file HTML POC prototype.

---

## Key Architectural Decisions

1. **FastAPI (Python 3.12) Backend**:
   - Asynchronous REST API layer providing modular routing, Pydantic validation, and SQLite persistence.
   - Built-in `EventSourceResponse` for Real-Time Pipeline Progress streaming over Server-Sent Events (SSE).

2. **Next.js (React / App Router) Frontend**:
   - Strict TypeScript configuration with **zero `any` types**.
   - **Tailwind CSS v4** (CSS-first `@theme` configuration) with custom components styled cleanly.
   - **TanStack Query (v5)** for server state management & caching.
   - **Zustand** for client-side state (LLM provider preferences, active pipeline stage).
   - **Zod** schemas for runtime API response validation.
   - **Mermaid.js** for client-side dynamic rendering of workflow step diagrams.

3. **LangChain Multi-LLM Provider Engine**:
   - Provider abstraction using `ChatGoogleGenerativeAI` (Gemini 2.5 Flash) as primary and `ChatOllama` (`qwen2.5:7b-instruct`) as fallback.
   - Native structured JSON output parsing via `with_structured_output(method="json_schema")` for guaranteed type safety.
   - User UI toggle allowing runtime switching of primary LLM.

4. **Multi-Stage Business Discovery Pipeline**:
   - **Stage 1: Ingestion** — Text extraction across PDFs, images (Tesseract OCR), transcripts, chat exports, Word docs, and web URLs.
   - **Stage 2: Extraction** — Synthesis of Main Goal, Current Process, Pain Points (traced to source file IDs), Requirements, and Information Gaps.
   - **Stage 3: Synthesis** — Actionable process improvements mapped directly to pain point IDs.
   - **Stage 4: Outline** — Features, User Roles, Screens/Modules, and Workflow Step Sequence.
   - **Stage 5: POC Generation** — Self-contained, runnable HTML/CSS/JS application prototype saved to disk and served via embedded iframe and direct download.

---

## Project Structure

```
craftlabs-poc-test/
├── assignment/                  # Original problem brief & evaluation criteria
├── backend/                     # FastAPI python service
│   ├── app/
│   │   ├── main.py              # FastAPI app setup, CORS, route mounting
│   │   ├── config.py            # Environment configuration
│   │   ├── constants.py         # Static enums, input types, pipeline stages
│   │   ├── database.py          # SQLite schema & query helpers
│   │   ├── models/              # Pydantic schemas & LLM output models
│   │   ├── routers/             # Projects, inputs, analysis, poc, app_settings APIs
│   │   └── services/            # Ingestion, LLM provider, pipeline, POC generator
│   ├── sample_data/             # 3 pre-configured scenario datasets (logistics, clinic, restaurant)
│   ├── tests/                   # Pytest integration suite
│   ├── requirements.txt         # Frozen backend dependencies
│   └── .env.example             # Template env config
└── frontend/                    # Next.js TypeScript web application
    ├── app/                     # App router pages (Home & Workspace)
    ├── components/              # Feature & UI components (FileUpload, Discovery, Solution, POC)
    ├── hooks/                   # Custom React hooks
    ├── lib/                     # API client, Zod schemas, constants, types
    ├── providers/               # TanStack QueryClientProvider
    └── stores/                  # Zustand state stores
```

---

## Quick Start / How to Run Locally

### Prerequisites
- **Python 3.12+**
- **Node.js 20+ & npm 10+**
- **Tesseract OCR** (installed at `/usr/bin/tesseract` or on system PATH)
- **Ollama** (optional, running at `http://localhost:11434` with `qwen2.5:7b-instruct` loaded for local LLM fallback)

---

### Step 1: Start Backend Server

```bash
cd backend

# Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (Gemini API key is already configured)
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend server will start at `http://localhost:8000`. You can inspect API docs at `http://localhost:8000/docs`.

---

### Step 2: Start Frontend Application

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

The web UI will open at `http://localhost:3000`.

---

## Verifying the Work & Testing

### 1. Automated Tests
- **Backend Unit & Integration Tests**:
  ```bash
  cd backend && source venv/bin/activate && python -m pytest tests/ -v
  ```
- **Frontend Type Check & Build**:
  ```bash
  cd frontend && npx tsc --noEmit && npm run build
  ```

### 2. Manual End-to-End Walkthrough
1. Open `http://localhost:3000`.
2. Click **"New Discovery Project"** or click one of the **Sample Client Scenarios** (e.g. *QuickShip Logistics*).
3. In the project workspace, inspect the attached inputs or upload custom files / add a website URL.
4. Click **"Run AI Pipeline"** to watch real-time progress across all 5 stages via SSE.
5. Switch to the **Business Discovery** tab to verify main goal, current process, pain points with source input ID tracing, and missing gaps.
6. Switch to the **Solution Outline** tab to inspect process improvements mapped to pain points, user roles, screens, and the interactive **Mermaid.js workflow diagram**.
7. Switch to the **Working POC Application** tab to interact with the generated single-file HTML application prototype directly inside the embedded preview iframe or download it locally.

---

## Assumptions & Scope Limits

- **Auth & Multi-tenancy**: Omitted per brief section 9 non-goals.
- **Teams / WhatsApp APIs**: Live third-party API integration omitted per brief; uploaded exports/transcripts are supported.
- **LLM Context Window**: Document inputs are combined up to ~8000 tokens for Ollama or ~100k tokens for Gemini.
