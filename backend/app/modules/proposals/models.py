from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime
from backend.app.core.database import Base

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False)
    budget = Column(Integer, nullable=False)
    headcount = Column(Integer, nullable=False)
    sustainability_priorities = Column(JSON, nullable=False)
    proposed_products = Column(JSON, nullable=False)
    total_cost = Column(Integer, nullable=False)
    cost_per_employee = Column(Float, nullable=False)
    budget_utilization_percent = Column(Float, nullable=False)
    impact_summary = Column(Text, nullable=False)
    raw_ai_response = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    response_tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
