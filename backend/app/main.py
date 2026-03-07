"""
FastAPI entry point for Rayeva AI Systems.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.database import init_db
from backend.app.core.logger import setup_logging
from backend.app.core.config import get_settings
from backend.app.modules.catalog.router import router as catalog_router
from backend.app.modules.proposals.router import router as proposals_router
from backend.app.modules.impact.router import router as impact_router


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    setup_logging(settings.LOG_LEVEL)
    await init_db()
    yield
    # Shutdown (nothing to clean up for now)


app = FastAPI(
    title="Rayeva AI Systems",
    description="AI-powered platform for sustainable commerce — Auto-categorization, proposals, impact reports & more.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register module routers
app.include_router(catalog_router)
app.include_router(proposals_router)
app.include_router(impact_router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "app": "Rayeva AI Systems",
        "version": "1.0.0",
    }
