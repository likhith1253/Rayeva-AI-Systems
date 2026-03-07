from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime
from backend.app.core.database import Base

class ImpactReport(Base):
    __tablename__ = "impact_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(100), nullable=False, unique=True)
    products = Column(JSON, nullable=False)
    total_quantity = Column(Integer, nullable=False)
    plastic_saved_grams = Column(Float, nullable=False)
    carbon_avoided_kg = Column(Float, nullable=False)
    local_sourcing_percent = Column(Float, nullable=False)
    trees_equivalent = Column(Float, nullable=False)
    impact_statement = Column(Text, nullable=False)
    raw_ai_response = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    response_tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
