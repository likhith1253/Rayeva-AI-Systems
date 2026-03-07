import logging
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.modules.impact.schemas import ImpactRequest, ImpactResponse, ImpactListItem
from backend.app.modules.impact.service import generate_impact_report, get_impact_history, get_impact_by_order_id

logger = logging.getLogger("rayeva.impact.router")

router = APIRouter(prefix="/api/impact", tags=["impact"])

@router.post("/generate", response_model=ImpactResponse)
async def generate(request: ImpactRequest, db: AsyncSession = Depends(get_db)):
    """Generate a new AI environmental impact statement for an order."""
    return await generate_impact_report(request, db)

@router.get("/history", response_model=List[ImpactListItem])
async def history(db: AsyncSession = Depends(get_db)):
    """Get the recent impact history across all orders."""
    return await get_impact_history(db)

@router.get("/{order_id}", response_model=ImpactResponse)
async def get_by_order_id(order_id: str, db: AsyncSession = Depends(get_db)):
    """Get an existing impact statement by order ID."""
    return await get_impact_by_order_id(order_id, db)
