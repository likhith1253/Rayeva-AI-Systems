from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.app.core.database import get_db
from backend.app.modules.support.schemas import ChatMessage, ChatResponse, SessionHistory, EscalationEntry
from backend.app.modules.support.service import process_message, get_session_history, get_all_escalations, clear_session

router = APIRouter(prefix="/api/support", tags=["support"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatMessage, db: AsyncSession = Depends(get_db)):
    return await process_message(request, db)

@router.get("/history/{session_id}", response_model=SessionHistory)
async def history_endpoint(session_id: str, db: AsyncSession = Depends(get_db)):
    return await get_session_history(session_id, db)

@router.get("/escalations", response_model=List[EscalationEntry])
async def escalations_endpoint(db: AsyncSession = Depends(get_db)):
    return await get_all_escalations(db)

@router.delete("/session/{session_id}")
async def clear_session_endpoint(session_id: str, db: AsyncSession = Depends(get_db)):
    return await clear_session(session_id, db)
