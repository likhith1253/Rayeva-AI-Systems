# Rayeva AI Systems

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![Claude](https://img.shields.io/badge/Claude-4%20Sonnet-purple)

## Project Overview

Rayeva AI Systems is a monorepo full-stack application serving as a production-ready AI platform for sustainable commerce. The platform acts as an operating system for merchants scaling their environmentally conscious businesses.

It currently features 4 AI-powered modules:
1. **AI Auto-Category & Tag Generator** ✅ — Autonomously categorizes products and assigns SEO/metadata tags.
2. **AI B2B Proposal Generator** — Drafts highly targeted, sustainable business proposals based on brief client contexts.
3. **AI Impact Reporting Generator** — Takes raw data and produces standardized ESG sustainability reports.
4. **AI WhatsApp Support Bot** — A conversational AI support simulator for complex B2B/B2C logic.

## Architecture Summary

* **Frontend:** React 18 + Tailwind CSS (Vite 5)
* **Backend:** Python + FastAPI (async)
* **Database:** SQLite (dev) / PostgreSQL (prod) via SQLAlchemy async
* **AI Provider:** Anthropic Claude API (model `claude-sonnet-4-20250514`)
* **Logging:** Every AI interaction logged to `prompt_logs` DB table

See [`project.md`](./project.md) for full architecture schemas, exact API protocols, and strict instructions on AI Prompt Design Strategies.

---

## Module 1: AI Auto-Category & Tag Generator

Takes a product name + description as input, calls the Claude API, and returns:
- **Primary category** (from 10 predefined categories)
- **Sub-category** suggestion
- **5–10 SEO tags** optimized for sustainable commerce search
- **Sustainability filters** (from 12 predefined filters)
- **Confidence score** (0–1)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/catalog/categorize` | Categorize a product (requires `product_name`, `description`) |
| `GET`  | `/api/catalog/history` | Get last 20 categorized products |
| `GET`  | `/api/catalog/categories` | Get predefined categories and sustainability filters |

### Example Request
```bash
curl -X POST http://localhost:8000/api/catalog/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Bamboo Toothbrush",
    "description": "A 100% biodegradable bamboo toothbrush with charcoal-infused bristles. Comes in plastic-free kraft paper packaging. Suitable for sensitive gums."
  }'
```

### Example Response
```json
{
  "id": 1,
  "product_name": "Bamboo Toothbrush",
  "primary_category": "Personal Care",
  "sub_category": "Oral Hygiene",
  "seo_tags": ["bamboo-toothbrush", "biodegradable-toothbrush", "eco-friendly-oral-care", "charcoal-bristle-brush", "plastic-free-toothbrush", "sustainable-dental-care"],
  "sustainability_filters": ["plastic-free", "biodegradable", "zero-waste", "compostable"],
  "confidence_score": 0.95,
  "created_at": "2026-03-07T12:00:00Z"
}
```

---

## Setup & Installation

### 1. Prerequisites
- Python 3.11+
- Node.js 20+
- Anthropic API Key (`claude-sonnet-4-20250514` access)

### 2. Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-org/Rayeva-AI-Systems.git
cd Rayeva-AI-Systems

# Create .env file from example
cp .env.example .env
# Edit .env and supply your ANTHROPIC_API_KEY
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Unix or MacOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Start Backend (from project root)
```bash
uvicorn backend.app.main:app --reload
```
API Documentation available at: `http://localhost:8000/docs`

### Start Frontend
```bash
cd frontend
npm run dev
```
Vite app running at: `http://localhost:5173`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `DATABASE_URL` | Database connection string | `sqlite+aiosqlite:///./dev.db` |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Testing
```bash
cd backend
pytest
```
