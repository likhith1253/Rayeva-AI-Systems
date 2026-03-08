from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    session_id: str = Field(..., min_length=3)
    message: str = Field(..., min_length=1, max_length=1000)

class ConversationEntry(BaseModel):
    id: int
    session_id: str
    role: str
    message: str
    intent: Optional[str] = None
    escalated: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    intent: str
    escalated: bool
    escalation_reason: Optional[str] = None
    suggested_actions: List[str]

class SessionHistory(BaseModel):
    session_id: str
    messages: List[ConversationEntry]
    total_messages: int
    has_escalation: bool

class EscalationEntry(BaseModel):
    id: int
    session_id: str
    reason: str
    user_message: str
    created_at: datetime

    class Config:
        from_attributes = True
