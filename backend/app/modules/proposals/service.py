import json
import logging
import time
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.modules.proposals.models import Proposal
from backend.app.modules.proposals.schemas import ProposalRequest, ProposalResponse, ProposalProduct, ProposalListItem
from backend.app.modules.proposals.prompts import get_proposal_prompt
from backend.app.core.ai_service import call_claude
from backend.app.core.logger import log_ai_interaction
import traceback

logger = logging.getLogger(__name__)

async def generate_proposal(request: ProposalRequest, db: AsyncSession) -> ProposalResponse:
    start_time = time.time()
    prompt = get_proposal_prompt(
        request.client_name, 
        request.industry, 
        request.budget, 
        request.headcount, 
        request.sustainability_priorities
    )
    
    try:
        # First attempt
        response_data = await call_claude(prompt)
        raw_response = response_data.get("raw_text", "")
        parsed_data = response_data.get("content", {})
        prompt_tokens = response_data.get("prompt_tokens", 0)
        response_tokens = response_data.get("response_tokens", 0)
        
        if not parsed_data:
            # Second attempt with explicit JSON instruction
            retry_prompt = prompt + "\n\nReturn only valid JSON, no other text."
            response_data = await call_claude(retry_prompt)
            raw_response = response_data.get("raw_text", "")
            parsed_data = response_data.get("content", {})
            prompt_tokens += response_data.get("prompt_tokens", 0)
            response_tokens += response_data.get("response_tokens", 0)
            
            if not parsed_data:
                raise HTTPException(status_code=500, detail="AI generation failed")
        
        products = parsed_data.get("proposed_products", [])
        impact_summary = parsed_data.get("impact_summary", "")
        
        # Calculate totals and adjust if over budget
        budget_adjusted = False
        total_cost = sum(p.get("total_price", p.get("quantity", 0) * p.get("unit_price", 0)) for p in products)
        
        if total_cost > request.budget:
            budget_adjusted = True
            scale_factor = request.budget / total_cost
            total_cost = 0
            
            for p in products:
                # Scale down quantity and recalculate
                scaled_qty = int(p.get("quantity", 1) * scale_factor)
                p["quantity"] = max(1, scaled_qty) # Ensure at least 1
                p["total_price"] = p["quantity"] * p.get("unit_price", 0)
                total_cost += p["total_price"]
                
        # Calculate metrics
        cost_per_employee = total_cost / request.headcount
        budget_utilization_percent = (total_cost / request.budget) * 100
        
        # Create DB record
        proposal_db = Proposal(
            client_name=request.client_name,
            industry=request.industry,
            budget=request.budget,
            headcount=request.headcount,
            sustainability_priorities=request.sustainability_priorities,
            proposed_products=products,
            total_cost=total_cost,
            cost_per_employee=cost_per_employee,
            budget_utilization_percent=budget_utilization_percent,
            impact_summary=impact_summary,
            raw_ai_response=raw_response,
            prompt_tokens=prompt_tokens,
            response_tokens=response_tokens
        )
        
        db.add(proposal_db)
        await db.flush() # Flush to get the ID without committing yet
        await db.commit()
        await db.refresh(proposal_db)
        
        # Log success
        latency_ms = int((time.time() - start_time) * 1000)
        await log_ai_interaction(
            db=db,
            module_name="proposals",
            input_payload=request.model_dump(),
            prompt_sent=prompt,
            raw_response=raw_response,
            tokens_used=prompt_tokens + response_tokens,
            latency_ms=latency_ms,
            success=True,
            error_message=""
        )
        
        return ProposalResponse(
            id=proposal_db.id,
            client_name=proposal_db.client_name,
            industry=proposal_db.industry,
            budget=proposal_db.budget,
            headcount=proposal_db.headcount,
            sustainability_priorities=proposal_db.sustainability_priorities,
            proposed_products=[ProposalProduct(**p) for p in proposal_db.proposed_products],
            total_cost=proposal_db.total_cost,
            cost_per_employee=proposal_db.cost_per_employee,
            budget_utilization_percent=proposal_db.budget_utilization_percent,
            impact_summary=proposal_db.impact_summary,
            budget_adjusted=budget_adjusted,
            created_at=proposal_db.created_at
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions directly
        await log_ai_interaction(
            db=db,
            module_name="proposals",
            input_payload=request.model_dump(),
            prompt_sent=prompt,
            raw_response="",
            tokens_used=0,
            latency_ms=int((time.time() - start_time) * 1000),
            success=False,
            error_message="AI generation failed (JSON parse error)"
        )
        raise
    except Exception as e:
        logger.error(f"Error generating proposal: {str(e)}")
        traceback.print_exc()
        await log_ai_interaction(
            db=db,
            module_name="proposals",
            input_payload=request.model_dump(),
            prompt_sent=prompt,
            raw_response="",
            tokens_used=0,
            latency_ms=int((time.time() - start_time) * 1000),
            success=False,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_proposal_history(db: AsyncSession) -> list[ProposalListItem]:
    try:
        query = select(Proposal).order_by(Proposal.created_at.desc()).limit(20)
        result = await db.execute(query)
        proposals = result.scalars().all()
        
        return [
            ProposalListItem(
                id=p.id,
                client_name=p.client_name,
                industry=p.industry,
                budget=p.budget,
                headcount=p.headcount,
                created_at=p.created_at
            ) for p in proposals
        ]
    except Exception as e:
        logger.error(f"Error fetching proposal history: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching history")

async def get_proposal_by_id(proposal_id: int, db: AsyncSession) -> ProposalResponse:
    try:
        query = select(Proposal).where(Proposal.id == proposal_id)
        result = await db.execute(query)
        proposal = result.scalar_one_or_none()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
            
        return ProposalResponse(
            id=proposal.id,
            client_name=proposal.client_name,
            industry=proposal.industry,
            budget=proposal.budget,
            headcount=proposal.headcount,
            sustainability_priorities=proposal.sustainability_priorities,
            proposed_products=[ProposalProduct(**p) for p in proposal.proposed_products],
            total_cost=proposal.total_cost,
            cost_per_employee=proposal.cost_per_employee,
            budget_utilization_percent=proposal.budget_utilization_percent,
            impact_summary=proposal.impact_summary,
            budget_adjusted=False, # We don't store this, but we can assume it's correct now
            created_at=proposal.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching proposal {proposal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching proposal")

async def export_proposal_markdown(proposal_id: int, db: AsyncSession) -> str:
    try:
        # We can reuse get_proposal_by_id
        proposal = await get_proposal_by_id(proposal_id, db)
        
        # Format products breakdown
        products_md = ""
        for p in proposal.proposed_products:
            products_md += f"- **{p.name}** ({p.category.title()})\n"
            products_md += f"  - Quantity: {p.quantity} @ ₹{p.unit_price} = ₹{p.total_price}\n"
            products_md += f"  - Benefit: {p.sustainability_benefit}\n"
            products_md += f"  - Why recommended: {p.why_recommended}\n\n"
            
        priorities_str = ", ".join(proposal.sustainability_priorities)
        
        markdown = f"""# Sustainable Commerce Proposal
## Prepared for: {proposal.client_name}
**Industry:** {proposal.industry} | **Headcount:** {proposal.headcount} employees
**Total Budget:** ₹{proposal.budget} | **Total Cost:** ₹{proposal.total_cost} (₹{proposal.cost_per_employee:.2f}/employee)
**Budget Utilization:** {proposal.budget_utilization_percent:.1f}%

### Customer Priorities
{priorities_str}

### Executive Impact Summary
{proposal.impact_summary}

### Recommended Product Mix
{products_md}
---
*Generated by Rayeva AI Systems on {proposal.created_at.strftime("%Y-%m-%d %H:%M")}*
"""
        return markdown
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting proposal {proposal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error formatting export")
