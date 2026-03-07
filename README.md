# Rayeva AI Systems

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![Claude](https://img.shields.io/badge/Claude-3.5%20Sonnet-purple)

## Project Overview

Rayeva AI Systems is a monorepo full-stack application serving as a production-ready AI platform for sustainable commerce. The platform acts as an operating system for merchants scaling their environmentally conscious businesses.

It currently features 4 AI-powered modules:
1. **AI Auto-Category & Tag Generator:** Autonomously categorizes products and assigns SEO/metadata tags.
2. **AI B2B Proposal Generator:** Drafts highly targeted, sustainable business proposals based on brief client contexts.
3. **AI Impact Reporting Generator:** Takes raw data and produces standardized ESG (Environmental, Social, Governance) sustainability reports.
4. **AI WhatsApp Support Bot:** A conversational AI support simulator for complex B2B/B2C logic.

## Architecture Summary

* **Frontend:** React + Tailwind CSS (Vite)
* **Backend:** Python + FastAPI
* **Database:** SQLite (dev) / PostgreSQL (prod) via SQLAlchemy
* **AI Provider:** Anthropic Claude API (model `claude-sonnet-4-20250514`)
* **Logging:** Structured JSON logs stored in DB.

See [`project.md`](./project.md) for full architecture schemas, exact API protocols, and strict instructions on AI Prompt Design Strategies.

## Setup & Installation

### 1. Prerequisites
- Python 3.11+
- Node.js 20+
- Anthropic API Key (`claude-sonnet-4-20250514` access)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Unix or MacOS:
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and supply your ANTHROPIC_API_KEY
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Start Database & Backend
```bash
cd backend
# With environment activated:
uvicorn app.main:app --reload
```
API Documentation available at: `http://localhost:8000/docs`

### Start Frontend
```bash
cd frontend
npm run dev
```
Vite app running at: `http://localhost:5173`

## Testing
```bash
cd backend
pytest
```
