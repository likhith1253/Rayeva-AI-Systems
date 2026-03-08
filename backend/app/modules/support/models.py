from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from backend.app.core.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False) # "user" or "assistant"
    message = Column(Text, nullable=False)
    intent = Column(String(100), nullable=True)
    escalated = Column(Boolean, default=False)
    escalation_reason = Column(String(255), nullable=True)
    raw_ai_response = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    response_tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EscalationLog(Base):
    __tablename__ = "escalation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), nullable=False)
    reason = Column(String(255), nullable=False)
    user_message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
