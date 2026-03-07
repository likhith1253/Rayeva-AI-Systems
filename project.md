# Rayeva AI Systems - Project Specification

## 1. Project Overview
Rayeva AI Systems is a production-ready AI platform built for sustainable commerce. It operates as a monorepo full-stack application leveraging a fast Python generic backend and a React frontend.

It contains 4 AI-powered modules:
1. **AI Auto-Category & Tag Generator:** Categorize products/services automatically.
2. **AI B2B Proposal Generator:** Draft targeted business proposals from input context.
3. **AI Impact Reporting Generator:** Generate sustainability and environmental impact reports.
4. **AI WhatsApp Support Bot:** Simulate conversational support for B2B/B2C users.

## 2. Project Architecture Diagram

```text
+-------------------------------------------------------------+
|                     Frontend (React + Tailwind CSS)         |
|                                                             |
| +-----------+ +-----------+ +-------------+ +-------------+ |
| | Tag UI    | | ProposalUI| | Impact UI   | | WhatsApp UI | |
| +-----------+ +-----------+ +-------------+ +-------------+ |
+-------------------------------------------------------------+
                              | HTTPS / REST Data APIs
+-------------------------------------------------------------+
|                       Backend (FastAPI)                     |
|                                                             |
| +-----------+ +-----------+ +-------------+ +-------------+ |
| | Category &| | B2B       | | Impact      | | WhatsApp    | |
| | Tag API   | | Proposal  | | Report API  | | Bot API     | |
| +-----------+ +-----------+ +-------------+ +-------------+ |
|                                                             |
| +---------------------------------------------------------+ |
| |                    Shared Core Services                 | |
| |  [ ai_service.py ]  [ logger.py ]    [ database.py ]    | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
                              | Queries & Logs
+-------------------------------------------------------------+
|                           Database                          |
|                     (SQLite Dev / PostgreSQL Prod)          |
|  [ Modules Data Tables ]          [ AI Prompt/Log Tables ]  |
+-------------------------------------------------------------+
                              | API Calls
+-------------------------------------------------------------+
|                      Anthropic Claude API                   |
|                   (claude-sonnet-4-20250514)                |
+-------------------------------------------------------------+
```

## 3. Folder / File Structure

```text
rayeva-ai-systems/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point
│   │   ├── core/                       # Shared Core Services
│   │   │   ├── ai_service.py           # Claude API wrapper
│   │   │   ├── logger.py               # Structured JSON prompt/response logging
│   │   │   ├── database.py             # SQLAlchemy setup
│   │   │   ├── config.py               # Pydantic env settings
│   │   │   └── exceptions.py           # Custom exception definitions
│   │   ├── modules/
│   │   │   ├── __init__.py
│   │   │   ├── tagging/                # Module 1
│   │   │   │   ├── router.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── service.py
│   │   │   ├── proposals/              # Module 2
│   │   │   │   ├── router.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── service.py
│   │   │   ├── impact/                 # Module 3
│   │   │   │   ├── router.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── service.py
│   │   │   └── whatsapp_bot/           # Module 4
│   │   │       ├── router.py
│   │   │       ├── schemas.py
│   │   │       └── service.py
│   │   └── models/                     # SQLAlchemy Models
│   │       ├── ai_logs.py
│   │       ├── product_tags.py
│   │       ├── proposals.py
│   │       ├── impact_reports.py
│   │       └── chat_sessions.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navigation.jsx      # Module Switcher
│   │   │   └── modules/
│   │   │       ├── tagging/            # Module 1 UI
│   │   │       ├── proposals/          # Module 2 UI
│   │   │       ├── impact/             # Module 3 UI
│   │   │       └── whatsapp_bot/       # Module 4 Chat UI
│   │   ├── api/
│   │   │   └── client.js               # Axios config
│   │   └── styles/
│   │       └── index.css               # Tailwind CSS
│   ├── package.json
│   └── tailwind.config.js
├── .gitignore
├── README.md
└── project.md                          # This file
```

## 4. Database Schema

### Table: `ai_request_logs` (Core Logging)
* `id` (UUID, Primary Key)
* `module` (String, e.g., 'tagging', 'proposal')
* `prompt_payload` (JSON)
* `response_payload` (JSON)
* `model_version` (String)
* `confidence_score` (Float)
* `tokens_used` (Integer)
* `created_at` (DateTime)

### Table: `product_tags` (Module 1)
* `id` (UUID, Primary Key)
* `product_name` (String)
* `product_description` (Text)
* `generated_category` (String)
* `generated_tags` (JSON) # Array of strings
* `created_at` (DateTime)

### Table: `proposals` (Module 2)
* `id` (UUID, Primary Key)
* `client_name` (String)
* `project_context` (Text)
* `generated_proposal` (Text) # Markdown format
* `created_at` (DateTime)

### Table: `impact_reports` (Module 3)
* `id` (UUID, Primary Key)
* `company_name` (String)
* `metrics_data` (JSON) # e.g., carbon emissions, water usage
* `generated_report` (Text) # Standardized ESG format
* `created_at` (DateTime)

### Table: `chat_sessions` (Module 4)
* `id` (UUID, Primary Key)
* `user_identifier` (String) # e.g., phone number or session ID
* `chat_history` (JSON) # Array of message objects {"role": "user/assistant", "content": "..."}
* `created_at` (DateTime)
* `updated_at` (DateTime)

## 5. API Endpoint Design

### Module 1: Tagging
* **POST /api/v1/tagging/generate**
    * *Request Body:* `{"product_name": "Bamboo Toothbrush", "description": "100% biodegradable..."}`
    * *Response:* `{"category": "Personal Care", "tags": ["sustainable", "biodegradable", "bamboo"]}`

### Module 2: Proposals
* **POST /api/v1/proposals/generate**
    * *Request Body:* `{"client_name": "EcoCorp", "context": "Needs bulk supply of..."}`
    * *Response:* `{"proposal_id": "uuid", "markdown_content": "# Proposal for EcoCorp..."}`

### Module 3: Impact Reporting
* **POST /api/v1/impact/generate**
    * *Request Body:* `{"company_name": "GreenTech", "metrics": {"carbon": "500t", "water": "2000L"}}`
    * *Response:* `{"report_id": "uuid", "report_content": "Sustainability Report for GreenTech..."}`

### Module 4: WhatsApp Support Bot
* **POST /api/v1/bot/chat**
    * *Request Body:* `{"session_id": "uuid", "message": "Can I return a defective item?"}`
    * *Response:* `{"session_id": "uuid", "reply": "Yes, our return policy allows..."}`

## 6. AI Prompt Design Strategy

For **Anthropic Claude API (claude-sonnet-4-20250514)**:
1. **System Prompts:** Define deep contexts. (e.g., "You are an expert B2B proposal writer specializing in sustainable commerce...").
2. **Chain-of-Thought (CoT):** Instruct the model to enclose its reasoning inside `<thinking>` tags before delivering the `<output>`. This improves logic and allows us to trace its decision-making.
3. **Few-Shot Examples:** Provide 1-2 examples of inputs mapped to exact acceptable JSON/Markdown outputs in the prompt.
4. **JSON Schema Enforcement:** Ask Claude to output strict JSON according to a provided schema. We use Pydantic models on the backend to validate this JSON response.
5. **Confidence Scoring:** Force the AI to output an internal `confidence_score` (between 0.0 and 1.0) along with its answer. If the score is below a threshold (e.g., 0.7), flag the response for human review.

## 7. Environment Variables (`.env.example`)
```env
# Backend Server
ENVIRONMENT=development
PORT=8000
DEBUG=True

# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-xxxx

# Database
DATABASE_URL=sqlite:///./dev.db
# DATABASE_URL=postgresql://user:password@localhost:5432/rayeva_db # For Prod

# Logging
LOG_LEVEL=INFO
```

## 8. Shared Core Services
* **`ai_service.py`**: A centralized singleton class `ClaudeClient` that wraps the Anthropic SDK. Handles asynchronous requests, retries, and token tracking. It enforces the return of JSON blocks via prompt suffixing.
* **`logger.py`**: A centralized JSON structured logger using Python's `logging` library. Every AI interaction logs: User Request, AI Thinking (CoT text), Full AI Response, Latency, and Cost. These logs are pushed to the database via async background tasks.
* **`database.py`**: SQLAlchemy async session (`async_sessionmaker`), Base declarative mapping, and `get_db` FastAPI dependency for injecting DB sessions into routers.

## 9. Error Handling Strategy
* **Validation Errors:** FastAPIs Pydantic validation cleanly catches bad HTTP requests. Anthropic text generation output is also run through Pydantic validators.
* **Retries:** `ai_service.py` uses `tenacity` for exponential backoff retries if the Anthropic API rate limits (HTTP 429) or times out (HTTP 502/504).
* **Fallbacks:** If AI returns unparseable JSON multiple times, the backend logs a critical error and returns a generic safe fallback response to the frontend (e.g., `{"error": "AI service degraded, please try again."}`).

## 10. README Outline
1. **Title & Badges**
2. **Project Description** (Rayeva AI Systems Overview, 4 Modules)
3. **Architecture Summary** (Monorepo setup)
4. **Prerequisites** (Python 3.11+, Node 20+, optional: PostgreSQL)
5. **Setup & Installation**
    - Backend virtualenv + requirements
    - Native DB setup (alembic migrations)
    - Frontend NPM install
6. **Running the Application** (Uvicorn backend, Vite frontend)
7. **Environment Variables** (How to setup Anthropic API Key)
8. **Testing** (Pytest instructions)
9. **License & Contributing**
