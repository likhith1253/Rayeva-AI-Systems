"""
SQLAlchemy model for catalog entries (categorized products).
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON

from backend.app.core.database import Base


class CatalogEntry(Base):
    """Stores categorized product entries from the AI Auto-Category & Tag Generator."""

    __tablename__ = "catalog_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    primary_category = Column(String(100), nullable=False, index=True)
    sub_category = Column(String(100), nullable=True)
    seo_tags = Column(JSON, nullable=True)
    sustainability_filters = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    raw_ai_response = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    response_tokens = Column(Integer, nullable=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<CatalogEntry(id={self.id}, product='{self.product_name}', category='{self.primary_category}')>"
