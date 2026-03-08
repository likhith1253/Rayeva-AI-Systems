## 1. Project Header

# Rayeva AI Systems

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827" alt="React" />
  <img src="https://img.shields.io/badge/Google%20Gemini-gemini--2.0--flash-4285F4?logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT" />
</p>

Rayeva AI Systems is a full-stack sustainable commerce platform that uses AI to automate high-friction operational workflows for eco-conscious businesses. The project solves a practical problem: sustainability-focused teams often lose time on repetitive classification, sales proposal drafting, impact communication, and support triage, all of which require structured outputs and business-rule grounding. This system addresses that with four integrated modules: Module 1 auto-categorizes products and generates SEO tags plus sustainability filters, Module 2 generates budget-aware B2B proposals, Module 3 computes impact metrics and produces personalized impact narratives, and Module 4 runs a WhatsApp-style support assistant with intent detection and escalation logging.

## 2. Table of Contents

- [1. Project Header](#1-project-header)
- [2. Table of Contents](#2-table-of-contents)
- [3. Architecture Overview](#3-architecture-overview)
- [4. Project Structure](#4-project-structure)
- [5. Modules](#5-modules)
- [6. AI Prompt Design](#6-ai-prompt-design)
- [7. Technical Requirements Compliance](#7-technical-requirements-compliance)
- [8. Setup and Installation](#8-setup-and-installation)
- [9. API Reference](#9-api-reference)
- [10. Evaluation Criteria Mapping](#10-evaluation-criteria-mapping)
- [11. Design Decisions](#11-design-decisions)
- [12. Future Improvements](#12-future-improvements)
- [13. Tech Stack](#13-tech-stack)
- [14. License](#14-license)

## 3. Architecture Overview

Rayeva AI Systems is implemented as a monorepo with a React frontend and a FastAPI backend, where each business module is organized using a consistent router-service-prompts-schemas-models pattern. The architecture separates concerns cleanly: routers expose HTTP contracts, services enforce deterministic business logic, prompts define model instructions, and shared core utilities (`ai_service.py`, `logger.py`, `database.py`) provide centralized AI invocation, observability, and persistence. All four modules share the same database session lifecycle and prompt logging pipeline, which creates consistent reliability behavior across categorization, proposals, impact reporting, and support workflows while keeping module-specific logic isolated and maintainable.

```text
+-----------------------------------------------------------------+
|                        RAYEVA AI SYSTEMS                        |
|                     Sustainable Commerce Platform                |
+-----------------------------------------------------------------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
              v                   v                   v
   +-----------------+  +-----------------+  +-----------------+
   |   React Frontend|  |  FastAPI Backend|  |    SQLite DB    |
   |   (Port 5173)   |  |   (Port 8000)   |  |   (Dev/Prod)    |
   +-----------------+  +-----------------+  +-----------------+
              |                   |                   |
              |         +---------+---------+         |
              |         |    Core Layer      |         |
              |         |  +-------------+  |         |
              |         |  | ai_service  |  |         |
              |         |  |  call_claude|  |         |
              |         |  +------+------+  |         |
              |         |  |   logger    |  |         |
              |         |  +-------------+  |         |
              |         |  +-------------+  |         |
              |         |  |  database   |  |         |
              |         |  +-------------+  |         |
              |         +---------+---------+         |
              |                   |                   |
              |    +--------------+--------------+    |
              |    |              |              |    |
              v    v              v              v    v
   +------------------------------------------------------+
   |                    AI MODULES                         |
   |                                                      |
   |  +------------+  +------------+  +------------+  +------------+ |
   |  |  Module 1  |  |  Module 2  |  |  Module 3  |  |  Module 4  | |
   |  |  Catalog   |  | Proposals  |  |   Impact   |  |  Support   | |
   |  |  & Tags    |  | Generator  |  | Reporting  |  |    Bot     | |
   |  +------------+  +------------+  +------------+  +------------+ |
   +------------------------------------------------------+
              |                   |
              v                   v
   +-----------------+  +-----------------+
   |  Google Gemini  |  |   Prompt Logs   |
   |  gemini-2.0     |  |   (All AI       |
   |  flash API      |  |   interactions) |
   +-----------------+  +-----------------+
```

```text
User Input
    |
    v
React Frontend
    |  HTTP POST
    v
FastAPI Router
    |
    v
Service Layer (Business Logic)
    |  Validates input
    |  Prepares data
    v
prompts.py
    |  Builds chain-of-thought prompt
    v
ai_service.call_claude()
    |  Calls Gemini API
    v
Google Gemini API
    |  Returns raw text
    v
ai_service (strips markdown, parses JSON)
    |
    v
Service Layer (validates AI output)
    |  Enforces business rules
    |  Recalculates numbers server-side
    v
logger.log_interaction()
    |  Saves to prompt_logs table
    v
Database (saves result)
    |
    v
FastAPI Router (serializes response)
    |
    v
React Frontend (renders result)
```

```text
+---------------------+     +---------------------+
|    catalog_entries  |     |      proposals       |
+---------------------+     +---------------------+
| id (PK)             |     | id (PK)              |
| product_name        |     | client_name          |
| description         |     | industry             |
| primary_category    |     | budget               |
| sub_category        |     | headcount            |
| seo_tags (JSON)     |     | sustainability_      |
| sustainability_     |     |   priorities (JSON)  |
|   filters (JSON)    |     | proposed_products    |
| confidence_score    |     |   (JSON)             |
| raw_ai_response     |     | total_cost           |
| prompt_tokens       |     | cost_per_employee    |
| response_tokens     |     | budget_utilization_  |
| created_at          |     |   percent            |
+---------------------+     | impact_summary       |
                            | raw_ai_response      |
+---------------------+     | prompt_tokens        |
|    impact_reports   |     | response_tokens      |
+---------------------+     | created_at           |
| id (PK)             |     +---------------------+
| order_id (UNIQUE)   |
| products (JSON)     |     +---------------------+
| total_quantity      |     |    conversations     |
| plastic_saved_grams |     +---------------------+
| carbon_avoided_kg   |     | id (PK)              |
| local_sourcing_     |     | session_id (IDX)     |
|   percent           |     | role                 |
| trees_equivalent    |     | message              |
| impact_statement    |     | intent               |
| raw_ai_response     |     | escalated            |
| prompt_tokens       |     | escalation_reason    |
| response_tokens     |     | raw_ai_response      |
| created_at          |     | prompt_tokens        |
+---------------------+     | response_tokens      |
                            | created_at           |
+---------------------+     +---------------------+
|   escalation_logs   |
+---------------------+     +---------------------+
| id (PK)             |     |     prompt_logs      |
| session_id          |     +---------------------+
| reason              |     | id (PK)              |
| user_message        |     | module_name          |
| created_at          |     | input_payload (JSON) |
+---------------------+     | prompt_sent          |
                            | raw_response         |
                            | tokens_used          |
                            | latency_ms           |
                            | success              |
                            | error_message        |
                            | created_at           |
                            +---------------------+
```

## 4. Project Structure

```text
.
+---backend
|   +---app
|   |   +---core
|   |   |   +---__init__.py
|   |   |   +---ai_service.py
|   |   |   +---config.py
|   |   |   +---database.py
|   |   |   +---exceptions.py
|   |   |   \---logger.py
|   |   +---models
|   |   |   +---ai_logs.py
|   |   |   +---chat_sessions.py
|   |   |   +---impact_reports.py
|   |   |   +---product_tags.py
|   |   |   \---proposals.py
|   |   +---modules
|   |   |   +---catalog
|   |   |   |   +---__init__.py
|   |   |   |   +---models.py
|   |   |   |   +---prompts.py
|   |   |   |   +---router.py
|   |   |   |   +---schemas.py
|   |   |   |   \---service.py
|   |   |   +---impact
|   |   |   |   +---models.py
|   |   |   |   +---prompts.py
|   |   |   |   +---router.py
|   |   |   |   +---schemas.py
|   |   |   |   \---service.py
|   |   |   +---proposals
|   |   |   |   +---models.py
|   |   |   |   +---prompts.py
|   |   |   |   +---router.py
|   |   |   |   +---schemas.py
|   |   |   |   \---service.py
|   |   |   +---support
|   |   |   |   +---mock_data.py
|   |   |   |   +---models.py
|   |   |   |   +---prompts.py
|   |   |   |   +---router.py
|   |   |   |   +---schemas.py
|   |   |   |   \---service.py
|   |   |   +---tagging
|   |   |   |   +---router.py
|   |   |   |   +---schemas.py
|   |   |   |   \---service.py
|   |   |   +---whatsapp_bot
|   |   |   |   +---router.py
|   |   |   |   +---schemas.py
|   |   |   |   \---service.py
|   |   |   \---__init__.py
|   |   +---__init__.py
|   |   \---main.py
|   +---modules
|   +---__init__.py
|   \---requirements.txt
+---frontend
|   +---src
|   |   +---api
|   |   |   \---client.js
|   |   +---components
|   |   |   +---layout
|   |   |   |   \---Navigation.jsx
|   |   |   \---modules
|   |   |       +---impact
|   |   |       |   \---index.jsx
|   |   |       +---proposals
|   |   |       |   \---index.jsx
|   |   |       +---tagging
|   |   |       |   \---index.jsx
|   |   |       \---whatsapp_bot
|   |   |           \---index.jsx
|   |   +---modules
|   |   |   +---catalog
|   |   |   |   \---CatalogPage.jsx
|   |   |   +---impact
|   |   |   |   \---ImpactPage.jsx
|   |   |   +---proposals
|   |   |   |   \---ProposalsPage.jsx
|   |   |   \---support
|   |   |       \---SupportPage.jsx
|   |   +---styles
|   |   |   \---index.css
|   |   +---App.jsx
|   |   +---index.css
|   |   \---main.jsx
|   +---index.html
|   +---package.json
|   +---package-lock.json
|   +---postcss.config.js
|   +---tailwind.config.js
|   \---vite.config.js
+---.env
+---.env.example
+---.gitignore
+---check_db.py
+---check_db_logs.py
+---check_db_logs_detailed.py
+---clean_db.py
+---dev.db
+---error.txt
+---error_trace.txt
+---print_log.py
+---project.md
+---README.md
+---test_ast.py
+---test_compile.py
+---test_debug.py
+---test_gemini.py
+---test_gemini_async.py
+---test_impact.py
+---test_manual.py
+---test_output.txt
+---test_results.txt
+---test_results_clean.txt
+---test_support.py
+---tree_clean.txt
+---tree_output.txt
+---tree_utf8.txt
+---verify_all_modules.py
\---verify_output.py
```

`backend/` contains all API code, shared core services, module business logic, and SQLAlchemy models.

`frontend/` contains the React single-page app, module UIs, API client wiring, and styling configuration.

Project-root scripts and artifacts provide local verification utilities, database inspection helpers, test scripts, and planning/documentation files.

## 5. Modules

### Module 1: AI Auto-Category & Tag Generator

This module classifies product listings into predefined commerce categories and returns machine-consumable metadata for discovery workflows. It combines prompt-based AI classification with deterministic server-side normalization so invalid categories, filters, and confidence values are corrected before persistence. The result is a reliable catalog-enrichment pipeline for sustainability-oriented products.

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/catalog/categorize` | Generate category, sub-category, SEO tags, sustainability filters, and confidence | `{ "product_name": str, "description": str }` | `CategorizeResponse` object |
| GET | `/api/catalog/history` | Return last 20 categorizations | None | `CatalogHistoryItem[]` |
| GET | `/api/catalog/categories` | Return allowed category/filter vocabularies | None | `{ "primary_categories": string[], "sustainability_filters": string[] }` |

**Input Example (`POST /api/catalog/categorize`)**

```json
{
  "product_name": "Organic Soap",
  "description": "Eco-friendly natural soap - made from 100% natural ingredients, zero waste packaging, and cruelty free."
}
```

**Output Example (`POST /api/catalog/categorize`)**

```json
{
  "id": 5,
  "product_name": "Organic Soap",
  "primary_category": "Home & Living",
  "sub_category": "Eco-Friendly Alternatives",
  "seo_tags": [
    "sustainable",
    "biodegradable",
    "zero-waste",
    "bamboo"
  ],
  "sustainability_filters": [],
  "confidence_score": 0.96,
  "created_at": "2026-03-08T14:15:28.544351"
}
```

**Business logic highlights**

- Category normalization uses string similarity (`SequenceMatcher`) to snap invalid AI categories to the nearest allowed `PRIMARY_CATEGORIES` value.
- Sustainability filters are hard-whitelisted against `SUSTAINABILITY_FILTERS`.
- `seo_tags` are coerced to string list and capped to 10 entries.
- `confidence_score` is clamped to `[0.0, 1.0]` and defaults to `0.5` when invalid.

### Module 2: AI B2B Proposal Generator

This module generates structured procurement proposals tailored to client industry, headcount, budget, and sustainability priorities. It treats AI output as draft data and re-enforces financial correctness on the server. The final response always includes normalized proposal items plus cost analytics needed for enterprise decision-making.

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/proposals/generate` | Generate AI B2B sustainability proposal | `{ "client_name": str, "industry": str, "budget": int, "headcount": int, "sustainability_priorities": string[] }` | `ProposalResponse` |
| GET | `/api/proposals/history` | Return last 20 proposals | None | `ProposalListItem[]` |
| GET | `/api/proposals/{id}` | Fetch one proposal by integer ID | None | `ProposalResponse` |
| POST | `/api/proposals/{id}/export` | Export proposal as markdown | None | `text/markdown` |

**Input Example (`POST /api/proposals/generate`)**

```json
{
  "client_name": "GreenTech Solutions",
  "industry": "Technology",
  "budget": 25000,
  "headcount": 50,
  "sustainability_priorities": [
    "Plastic Reduction",
    "Employee Wellness"
  ]
}
```

**Output Example (`POST /api/proposals/generate`)**

```json
{
  "id": 2,
  "client_name": "GreenTech Solutions",
  "industry": "Technology",
  "budget": 25000,
  "headcount": 50,
  "sustainability_priorities": [
    "Plastic Reduction",
    "Employee Wellness"
  ],
  "proposed_products": [
    {
      "name": "Bamboo Toilet Paper (48 Rolls)",
      "category": "personal care",
      "quantity": 10,
      "unit_price": 850,
      "total_price": 8500,
      "sustainability_benefit": "100% tree-free and biodegradable, saving approx 5 trees annually.",
      "why_recommended": "Essential for office bathrooms; supports wellness while drastically reducing paper waste."
    },
    {
      "name": "Fairtrade Organic Coffee Beans (1kg)",
      "category": "pantry staples",
      "quantity": 6,
      "unit_price": 1200,
      "total_price": 7200,
      "sustainability_benefit": "Ethically sourced with completely compostable packaging.",
      "why_recommended": "High daily consumption in tech offices makes sustainable coffee a high-impact swap."
    },
    {
      "name": "Reusable Glass Water Bottles",
      "category": "office supplies",
      "quantity": 50,
      "unit_price": 150,
      "total_price": 7500,
      "sustainability_benefit": "Eliminates single-use plastic water bottles.",
      "why_recommended": "One for each employee to promote hydration and achieve the plastic reduction goal."
    },
    {
      "name": "Eco-friendly Multi-surface Cleaner (5L)",
      "category": "cleaning products",
      "quantity": 2,
      "unit_price": 650,
      "total_price": 1300,
      "sustainability_benefit": "Non-toxic, plant-based ingredients in bulk recyclable containers.",
      "why_recommended": "Ensures a safe, chemical-free working environment for employees."
    }
  ],
  "total_cost": 24500,
  "cost_per_employee": 490.0,
  "budget_utilization_percent": 98.0,
  "impact_summary": "By transitioning to these sustainable alternatives, we take a definitive step toward our plastic reduction and employee wellness goals. Replacing single-use plastics and conventional paper products significantly lowers our office carbon footprint and provides tangible ESG talking points. Furthermore, providing eco-conscious pantry and restroom supplies reinforces a culture of care and sustainability.",
  "budget_adjusted": false,
  "created_at": "2026-03-07T14:46:43.115885"
}
```

**Business logic highlights**

- Input validation enforces `budget >= 5000`, `headcount >= 5`, and minimum `?100` per employee.
- Total cost is recalculated server-side from `quantity * unit_price` regardless of AI totals.
- If `total_cost > budget`, quantities are scaled by `scale_factor = budget / total_cost` and floor-cast to `int`, with a minimum quantity of `1`.
- Financial outputs (`total_cost`, `cost_per_employee`, `budget_utilization_percent`) are always recomputed after scaling.

### Module 3: AI Impact Reporting Generator

This module computes environmental metrics from product-level order data and then asks AI only for the narrative framing. Metrics are deterministic and reproducible because they are calculated in Python before AI invocation. The generated response combines verifiable numbers with a customer-friendly impact statement.

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/impact/generate` | Generate impact report for an order | `{ "order_id": str, "products": OrderProduct[] }` | `ImpactResponse` |
| GET | `/api/impact/history` | Return last 20 impact reports | None | `ImpactListItem[]` |
| GET | `/api/impact/{order_id}` | Fetch report by order ID | None | `ImpactResponse` |

**Input Example (`POST /api/impact/generate`)**

```json
{
  "order_id": "ORD-886X52",
  "products": [
    {
      "name": "Bamboo Toothbrush",
      "category": "Personal Care",
      "quantity": 10,
      "is_sustainable": true,
      "weight_grams": 15.0,
      "is_local": true
    },
    {
      "name": "Organic Soap",
      "category": "Personal Care",
      "quantity": 5,
      "is_sustainable": true,
      "weight_grams": 100.0,
      "is_local": false
    }
  ]
}
```

**Output Example (`POST /api/impact/generate`)**

```json
{
  "id": 7,
  "order_id": "ORD-886X52",
  "products": [
    {
      "name": "Bamboo Toothbrush",
      "category": "Personal Care",
      "quantity": 10,
      "is_sustainable": true,
      "weight_grams": 15.0,
      "is_local": true
    },
    {
      "name": "Organic Soap",
      "category": "Personal Care",
      "quantity": 5,
      "is_sustainable": true,
      "weight_grams": 100.0,
      "is_local": false
    }
  ],
  "total_quantity": 15,
  "metrics": {
    "plastic_saved_grams": 390.0,
    "carbon_avoided_kg": 2.34,
    "local_sourcing_percent": 50.0,
    "trees_equivalent": 0.11
  },
  "impact_statement": "Your order prevented significant plastic pollution and supported robust environmental sustainability directly replacing standard alternatives.",
  "created_at": "2026-03-08T14:11:15.940756"
}
```

**Business logic highlights**

- `plastic_saved_grams = sum(quantity × weight_grams × 0.6)` for sustainable products.
- `carbon_avoided_kg = plastic_saved_grams × 0.006`.
- `local_sourcing_percent = (local products / total products) × 100`.
- `trees_equivalent = carbon_avoided_kg / 21.77`.
- Metrics are rounded in service logic before prompt injection and persisted alongside AI narrative.

### Module 4: AI WhatsApp Support Bot

This module simulates a WhatsApp support workflow with session-based history, intent tagging, and escalation tracking. It persists both user and assistant turns so support context is auditable and replayable. AI output is parsed into a strict response object used by the frontend chat UI and escalation dashboard.

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/support/chat` | Send a user message and get assistant reply | `{ "session_id": str, "message": str }` | `ChatResponse` |
| GET | `/api/support/history/{session_id}` | Retrieve session transcript | None | `SessionHistory` |
| GET | `/api/support/escalations` | Retrieve all escalated sessions | None | `EscalationEntry[]` |
| DELETE | `/api/support/session/{session_id}` | Clear all messages in a session | None | `{ "cleared": true, "session_id": str }` |

**Input Example (`POST /api/support/chat`)**

```json
{
  "session_id": "sess_ifuh05wvmmhubf8h",
  "message": "Where is my order ORD-801?"
}
```

**Output Example (`POST /api/support/chat`)**

```json
{
  "session_id": "sess_ifuh05wvmmhubf8h",
  "reply": "I am so sorry for the frustration. I am escalating this to our priority support team immediately.",
  "intent": "complaint",
  "escalated": true,
  "escalation_reason": "Customer expressed extreme dissatisfaction and requested a refund.",
  "suggested_actions": [
    "Contact Support",
    "Return Policy"
  ]
}
```

**Business logic highlights**

- Intent classes instructed in prompt: `order_status`, `return_policy`, `product_inquiry`, `complaint`, `refund_request`, `escalation_needed`, `general`.
- Escalation triggers: refund request, abusive/profane language, legal threat, direct human/manager request, or unresolved issue.
- Conversation history management: user turn saved first, last 10 turns loaded, and the prompt includes the most recent 5 turns for bounded context.
- On parse failure after retries, service returns a deterministic fallback reply and still logs the failed interaction.

## 6. AI Prompt Design

### Prompt Engineering Philosophy

Each module prompt is written as a role-constrained, step-oriented instruction set rather than a single direct question. This chain-of-thought style scaffolding improves output structure because the model is guided through domain reasoning stages (classification, constraints, calculation context, and formatting) before producing the final payload. In this codebase, the prompts explicitly instruct the model to think step-by-step internally while returning only structured JSON externally, which balances reasoning quality with strict machine parsability.

### JSON Schema Enforcement

The system uses a layered JSON reliability strategy:

- Schema defined explicitly in every prompt.
- Markdown fence stripping in `backend/app/core/ai_service.py` before `json.loads`.
- Retry logic with stricter prompt on parse failure (catalog strict retry prompt, impact/proposals retry suffix instructions).
- Server-side validation after parsing through Pydantic schemas and service-level post-processing.

This combination prevents malformed output from propagating to API responses or database rows.

### Few-Shot Examples

Every module prompt includes at least one concrete example mapping realistic input to exact output shape. This few-shot anchoring reduces format drift and improves field completeness by demonstrating key names, field types, and output granularity in-context. For proposal generation specifically, the few-shot sample also anchors realistic INR pricing and category vocabulary, reducing the chance of implausible procurement outputs.

### Prompt Structure Template

```text
[ROLE DEFINITION]
You are a [specific role] for [specific context]...

[CONTEXT]
Here is the relevant data: [dynamic data injection]

[CHAIN OF THOUGHT INSTRUCTIONS]
Think through this step by step:
Step 1: [reasoning step]
Step 2: [reasoning step]
...

[FEW SHOT EXAMPLE]
Example input: [example]
Example output: [exact JSON]

[OUTPUT INSTRUCTION]
Return ONLY a JSON object matching this exact schema:
[schema definition]
No markdown, no explanation, no extra text.
```

### Module-Specific Prompt Decisions

**Module 1 (Catalog):** The prompt evaluates sustainability filters after category and SEO tag generation so the model first identifies what the product is before applying compliance labels. It also explicitly warns against guessing filters and tells the model not to hallucinate unsupported claims. This ordering matters because a premature filter decision tends to overfit on eco-keywords and increases false positives. The whitelist post-processing in service logic reinforces this prompt discipline.

**Module 2 (Proposals):** Budget and headcount are injected as first-class prompt parameters so the model reasons around operational scale and commercial constraints, not just generic product recommendations. The few-shot block demonstrates realistic INR-denominated unit pricing and total pricing behavior in the exact JSON schema. That example acts as a pricing prior, improving numerical consistency. Server-side recalculation then hardens the final result regardless of model arithmetic quality.

**Module 3 (Impact):** Metrics are pre-calculated in Python and inserted into the prompt so AI only handles narrative generation. This reduces model error on quantitative formulas and keeps impact numbers deterministic and auditable. The prompt explicitly says “use exactly these numbers” and forbids invention of new metrics. As a result, narrative quality is AI-driven while numeric correctness is code-driven.

**Module 4 (Support):** Every turn includes recent conversation context plus mock order data, enabling stateful responses that reference prior messages and known order facts. The prompt defines escalation rules in explicit bullet conditions instead of vague “escalate when needed” language. That precision improves consistency in high-risk intents (refund/legal/abusive cases). The backend then stores both conversation and escalation logs for operational traceability.

### Confidence Scoring

Module 1 explicitly asks the model for a `confidence_score` between `0.0` and `1.0` and returns it to API consumers. The backend clamps this value to the valid range and persists it with the catalog entry, enabling downstream triage logic (for example, manual review thresholds on lower-confidence outputs). Exposing confidence directly also improves transparency for catalog operators who need to trust or override AI classification decisions.

## 7. Technical Requirements Compliance

| Requirement | Implementation | Files |
|---|---|---|
| Structured JSON outputs | Pydantic schemas validate request/response contracts, and every module prompt defines explicit JSON output schema | `backend/app/modules/*/schemas.py`, `backend/app/modules/*/prompts.py` |
| Prompt + response logging | Every AI interaction is persisted to `prompt_logs` with module, prompt, raw response, tokens, latency, and success/error state | `backend/app/core/logger.py` |
| Environment-based API key management | `GEMINI_API_KEY` is loaded from environment using settings and `.env` conventions; no hardcoded key in module code | `.env.example`, `backend/app/core/config.py`, `backend/app/core/ai_service.py` |
| Clear separation of AI and business logic | `call_claude()` is centralized in core AI service; module services own domain rules, validation, recalculation, and DB writes | `backend/app/core/ai_service.py`, `backend/app/modules/*/service.py` |
| Error handling and validation | Input validation via Pydantic, module-level retries/fallbacks, structured exceptions, and guarded logging paths | `backend/app/modules/*/service.py`, `backend/app/core/exceptions.py` |

## 8. Setup and Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git
- Google account (to create Gemini API key)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rayeva-ai-systems.git
cd rayeva-ai-systems
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
```

**Windows (PowerShell):**

```bash
.venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install dependencies and configure environment file:

```bash
pip install -r requirements.txt
cd ..
```

**Windows:**

```bash
copy .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

### 3. Get Your Free Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key (typically starts with `AIza`)
5. Open `.env` and set:

```env
GEMINI_API_KEY=your_key_here
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

### 5. Run the Application

Open two terminals.

**Terminal A (Backend):**

```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal B (Frontend):**

```bash
cd frontend
npm run dev
```

Run URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8000`
- FastAPI docs: `http://127.0.0.1:8000/docs`

### 6. Verify Everything Works

Open the frontend and test all four modules (Catalog, Proposals, Impact, Support) using the sample request payloads in Section 5. Then open `/docs` and confirm each endpoint returns valid responses for at least one test call.

## 9. API Reference

| Module | Method | Endpoint | Description |
|---|---|---|---|
| Catalog | POST | `/api/catalog/categorize` | Generate category and tags for a product |
| Catalog | GET | `/api/catalog/history` | Get last 20 categorized products |
| Catalog | GET | `/api/catalog/categories` | Get predefined categories list |
| Proposals | POST | `/api/proposals/generate` | Generate B2B proposal |
| Proposals | GET | `/api/proposals/history` | Get last 20 proposals |
| Proposals | GET | `/api/proposals/{id}` | Get proposal by ID |
| Proposals | POST | `/api/proposals/{id}/export` | Export proposal as markdown |
| Impact | POST | `/api/impact/generate` | Generate impact report for order |
| Impact | GET | `/api/impact/history` | Get last 20 impact reports |
| Impact | GET | `/api/impact/{order_id}` | Get report by order ID |
| Support | POST | `/api/support/chat` | Send message to support bot |
| Support | GET | `/api/support/history/{session_id}` | Get chat history for session |
| Support | GET | `/api/support/escalations` | Get all escalated conversations |
| Support | DELETE | `/api/support/session/{session_id}` | Clear chat session |

FastAPI auto-generates interactive API docs at `http://localhost:8000/docs`.

## 10. Evaluation Criteria Mapping

| Criteria (20% each) | Where to find it in this project |
|---|---|
| Structured AI Outputs | All module `schemas.py` files, explicit JSON schemas inside `prompts.py`, backend response validation in service layer |
| Business Logic Grounding | Module 2 budget/headcount checks and scaling in `proposals/service.py`, Module 3 formula computation in `impact/service.py`, Module 4 escalation rules in `support/prompts.py` + `support/service.py` |
| Clean Architecture | Shared `core/` services, module-wise separation of router/service/prompts/schemas/models, centralized DB lifecycle in `core/database.py` |
| Practical Usefulness | Four directly usable flows: catalog automation, B2B proposal generation, ESG-style impact reporting, and support triage/escalation tracking |
| Creativity & Reasoning | Step-oriented prompts, few-shot format anchoring, confidence scoring in Module 1, WhatsApp-style support UI, narrative generation constrained by deterministic metrics |

## 11. Design Decisions

1. **Monorepo over separate repos**: The product is a tightly coupled full-stack system with a shared release cadence, so keeping frontend and backend together simplifies local setup, API/UI synchronization, and review for internship evaluators.
2. **`ai_service.py` as single AI gateway**: Centralizing provider invocation reduces duplication, standardizes JSON parsing and token tracking behavior, and creates one integration surface for future provider changes.
3. **Server-side metric computation in Module 3**: Environmental formulas are deterministic and auditable, so they are computed in Python to avoid model arithmetic drift and to guarantee repeatability.
4. **Simulated WhatsApp UI instead of direct WhatsApp API**: A local simulation preserves the conversational UX and escalation workflows without requiring third-party messaging infrastructure during internship evaluation.
5. **Keeping `call_claude()` name after Gemini migration**: The existing call surface was retained to avoid broad refactors across modules and to minimize regression risk while switching AI providers under the hood.

## 12. Future Improvements

- Integrate the real WhatsApp Business API (for example via Twilio) for production message delivery and webhook handling.
- Add vector search for semantic product retrieval in Module 1 to improve category/tag recommendations with retrieval-augmented context.
- Add multilingual impact statement generation in Module 3 for customer-localized sustainability messaging.
- Replace mock support-order data with live order-management integration in Module 4.
- Build an A/B prompt experimentation framework with version tagging and performance dashboards.
- Add an admin observability dashboard for model usage, latency, failures, and token-cost analytics.
- Introduce request-level caching for repeated catalog/proposal payloads.
- Add webhook/event support for real-time proposal generation notifications.

## 13. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| AI Provider | Google Gemini 2.0 Flash | Natural language generation across all modules |
| Backend Framework | FastAPI | REST APIs, OpenAPI docs, async request handling |
| ORM | SQLAlchemy | Database models, query execution, session management |
| Validation | Pydantic v2 | Request/response schema validation |
| Database | SQLite (dev) / PostgreSQL (prod) | Persistent storage for modules and prompt logs |
| Frontend | React 18 | Component-based SPA for all four modules |
| Styling | Tailwind CSS | Utility-first responsive UI styling |
| Charts | Recharts | Proposal and impact data visualization |
| Environment | python-dotenv + pydantic-settings | Environment variable and secret configuration |
| Server | Uvicorn | ASGI runtime for FastAPI |

## 14. License

```text
MIT License

Copyright (c) 2026 Rayeva AI Systems

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

