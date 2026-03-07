"""
Pydantic schemas for request validation and response serialization.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Request Schemas ───────────────────────────────────────────────

class CategorizeRequest(BaseModel):
    """Input schema for the categorize endpoint."""

    product_name: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Name of the product (minimum 3 characters)",
        examples=["Bamboo Toothbrush"],
    )
    description: str = Field(
        ...,
        min_length=20,
        max_length=1000,
        description="Full product description (20–1000 characters)",
        examples=[
            "A 100% biodegradable bamboo toothbrush with charcoal-infused bristles. "
            "Comes in plastic-free kraft paper packaging. Suitable for sensitive gums."
        ],
    )


# ── Response Schemas ──────────────────────────────────────────────

class CategorizeResponse(BaseModel):
    """Full structured output from the AI categorization."""

    id: int
    product_name: str
    primary_category: str
    sub_category: Optional[str] = None
    seo_tags: List[str] = []
    sustainability_filters: List[str] = []
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    created_at: datetime

    model_config = {"from_attributes": True}


class CatalogHistoryItem(BaseModel):
    """Compact representation for history list."""

    id: int
    product_name: str
    primary_category: str
    sub_category: Optional[str] = None
    seo_tags: List[str] = []
    sustainability_filters: List[str] = []
    confidence_score: float
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoriesResponse(BaseModel):
    """Returns the predefined categories and sustainability filters."""

    primary_categories: List[str]
    sustainability_filters: List[str]


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
