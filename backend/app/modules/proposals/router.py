from typing import List
from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.modules.proposals.schemas import ProposalRequest, ProposalResponse, ProposalListItem
from backend.app.modules.proposals.service import (
    generate_proposal, 
    get_proposal_history, 
    get_proposal_by_id, 
    export_proposal_markdown
)

router = APIRouter(prefix="/api/proposals", tags=["proposals"])

@router.post("/generate", response_model=ProposalResponse)
async def generate_proposal_endpoint(request: ProposalRequest, db: AsyncSession = Depends(get_db)):
    """Generate a new AI-powered sustainability proposal."""
    return await generate_proposal(request, db)

@router.get("/history", response_model=List[ProposalListItem])
async def get_proposal_history_endpoint(db: AsyncSession = Depends(get_db)):
    """Get the last 20 generated proposals."""
    return await get_proposal_history(db)

@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal_by_id_endpoint(proposal_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific proposal by ID."""
    return await get_proposal_by_id(proposal_id, db)

@router.post("/{proposal_id}/export", response_class=PlainTextResponse)
async def export_proposal_markdown_endpoint(proposal_id: int, db: AsyncSession = Depends(get_db)):
    """Export a proposal as a Markdown-formatted document."""
    return await export_proposal_markdown(proposal_id, db)
