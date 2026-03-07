"""
FastAPI router for the AI Auto-Category & Tag Generator module.
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.exceptions import AIServiceError
from backend.app.modules.catalog.schemas import (
    CategorizeRequest,
    CategorizeResponse,
    CatalogHistoryItem,
    CategoriesResponse,
)
from backend.app.modules.catalog.service import (
    categorize_product,
    get_history,
    get_categories,
)

logger = logging.getLogger("rayeva.catalog.router")

router = APIRouter(prefix="/api/catalog", tags=["Catalog — AI Auto-Category & Tag Generator"])


@router.post(
    "/categorize",
    response_model=CategorizeResponse,
    summary="Categorize a product using AI",
    description="Takes a product name and description, calls Claude AI, and returns structured categorization data.",
)
async def categorize(
    request: CategorizeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Categorize a product with AI-generated category, tags, and sustainability filters."""
    try:
        entry = await categorize_product(db, request)
        return CategorizeResponse.model_validate(entry)
    except AIServiceError as e:
        logger.error("Categorization endpoint error: %s", str(e))
        raise HTTPException(status_code=502, detail=str(e.message))
    except Exception as e:
        logger.error("Unexpected error in categorize endpoint: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error. Please try again.")


@router.get(
    "/history",
    response_model=List[CatalogHistoryItem],
    summary="Get categorization history",
    description="Returns the last 20 categorized products, ordered by most recent first.",
)
async def history(db: AsyncSession = Depends(get_db)):
    """Retrieve recent categorization history."""
    try:
        entries = await get_history(db, limit=20)
        return [CatalogHistoryItem.model_validate(e) for e in entries]
    except Exception as e:
        logger.error("History endpoint error: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve history.")


@router.get(
    "/categories",
    response_model=CategoriesResponse,
    summary="Get predefined categories and filters",
    description="Returns the list of predefined primary categories and sustainability filters.",
)
async def categories():
    """Return available categories and sustainability filters."""
    return get_categories()
