import json
import logging
import time
from fastapi import HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.modules.impact.models import ImpactReport
from backend.app.modules.impact.schemas import ImpactRequest, ImpactResponse, ImpactMetrics, ImpactListItem, OrderProduct
from backend.app.modules.impact.prompts import get_impact_prompt
from backend.app.core.ai_service import call_claude
from backend.app.core.logger import log_ai_interaction

logger = logging.getLogger("rayeva.impact.service")

async def generate_impact_report(request: ImpactRequest, db: AsyncSession) -> ImpactResponse:
    # 1. Check if order_id already exists in DB
    try:
        query = select(ImpactReport).where(ImpactReport.order_id == request.order_id)
        result = await db.execute(query)
        existing_report = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error checking existing report: {e}")
        existing_report = None
        
    if existing_report:
        metrics = ImpactMetrics(
            plastic_saved_grams=existing_report.plastic_saved_grams,
            carbon_avoided_kg=existing_report.carbon_avoided_kg,
            local_sourcing_percent=existing_report.local_sourcing_percent,
            trees_equivalent=existing_report.trees_equivalent
        )
        products = [OrderProduct(**p) for p in existing_report.products]
        return ImpactResponse(
            id=existing_report.id,
            order_id=existing_report.order_id,
            products=products,
            total_quantity=existing_report.total_quantity,
            metrics=metrics,
            impact_statement=existing_report.impact_statement,
            created_at=existing_report.created_at
        )

    # 2. Calculate metrics
    try:
        total_quantity = sum(p.quantity for p in request.products)
        plastic_saved_grams = sum(p.quantity * p.weight_grams * 0.6 for p in request.products if p.is_sustainable)
        carbon_avoided_kg = plastic_saved_grams * 0.006
        
        local_count = sum(1 for p in request.products if p.is_local)
        local_sourcing_percent = (local_count / len(request.products)) * 100 if request.products else 0.0
        
        trees_equivalent = carbon_avoided_kg / 21.77
        
        metrics_dict = {
            "plastic_saved_grams": round(plastic_saved_grams, 2),
            "carbon_avoided_kg": round(carbon_avoided_kg, 2),
            "local_sourcing_percent": round(local_sourcing_percent, 2),
            "trees_equivalent": round(trees_equivalent, 2)
        }
    except Exception as e:
        logger.error(f"Failed calculating metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate impact metrics")

    # 3. Call get_impact_prompt
    products_dict = [p.model_dump() for p in request.products]
    prompt = get_impact_prompt(request.order_id, products_dict, metrics_dict)
    
    # 4 & 5. Call AI and parse response
    impact_statement = ""
    raw_response = None
    prompt_tokens = 0
    response_tokens = 0
    success = False
    error_message = None
    
    start_time = time.time()
    
    for attempt in range(2):
        try:
            current_prompt = prompt if attempt == 0 else prompt + "\nReturn only valid JSON with field impact_statement"
            ai_result = await call_claude(current_prompt)
            parsed = ai_result.get("content", {})
            raw_response = ai_result.get("raw_text", "")
            prompt_tokens = ai_result.get("prompt_tokens", 0)
            response_tokens = ai_result.get("response_tokens", 0)
            
            # Extract impact_statement directly since content is already a parsed dict
            if isinstance(parsed, dict):
                impact_statement = parsed.get("impact_statement", "")
            elif isinstance(parsed, str):
                try:
                    parsed_json = json.loads(parsed)
                    impact_statement = parsed_json.get("impact_statement", "")
                except json.JSONDecodeError:
                    pass
            
            if impact_statement:
                success = True
                break
        except Exception as e:
            error_message = str(e)
            logger.warning(f"AI call attempt {attempt+1} failed: {error_message}")
            if attempt == 1:
                break
                
    if not success or not impact_statement:
        psg = metrics_dict['plastic_saved_grams']
        cak = metrics_dict['carbon_avoided_kg']
        impact_statement = f"This order saved {psg}g of plastic and avoided {cak}kg of carbon emissions through sustainable product choices."
        error_message = f"Failed to generate valid impact statement via AI, used fallback. Last error: {error_message}"
        
    latency_ms = int((time.time() - start_time) * 1000)
    
    # 7. Log interaction
    try:
        await log_ai_interaction(
            db=db,
            module_name="impact",
            input_payload=request.model_dump(),
            prompt_sent=prompt,
            raw_response=raw_response,
            tokens_used=prompt_tokens + response_tokens,
            latency_ms=latency_ms,
            success=success,
            error_message=error_message
        )
    except Exception as e:
        logger.error(f"Failed to log interaction: {e}")
        
    # 6. Save ImpactReport to DB
    try:
        new_report = ImpactReport(
            order_id=request.order_id,
            products=products_dict,
            total_quantity=total_quantity,
            plastic_saved_grams=metrics_dict["plastic_saved_grams"],
            carbon_avoided_kg=metrics_dict["carbon_avoided_kg"],
            local_sourcing_percent=metrics_dict["local_sourcing_percent"],
            trees_equivalent=metrics_dict["trees_equivalent"],
            impact_statement=impact_statement,
            raw_ai_response=raw_response,
            prompt_tokens=prompt_tokens,
            response_tokens=response_tokens
        )
        db.add(new_report)
        await db.commit()
        await db.refresh(new_report)
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to save impact report to DB: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred.")
        
    # 8. Return ImpactResponse
    return ImpactResponse(
        id=new_report.id,
        order_id=new_report.order_id,
        products=request.products,
        total_quantity=total_quantity,
        metrics=ImpactMetrics(**metrics_dict),
        impact_statement=impact_statement,
        created_at=new_report.created_at
    )

async def get_impact_history(db: AsyncSession):
    try:
        query = select(ImpactReport).order_by(ImpactReport.created_at.desc()).limit(20)
        result = await db.execute(query)
        reports = result.scalars().all()
        
        return [
            ImpactListItem(
                id=r.id,
                order_id=r.order_id,
                total_quantity=r.total_quantity,
                plastic_saved_grams=r.plastic_saved_grams,
                carbon_avoided_kg=r.carbon_avoided_kg,
                created_at=r.created_at
            ) for r in reports
        ]
    except Exception as e:
        logger.error(f"Error retrieving history: {e}")
        raise HTTPException(status_code=500, detail="Error fetching history")

async def get_impact_by_order_id(order_id: str, db: AsyncSession) -> ImpactResponse:
    try:
        query = select(ImpactReport).where(ImpactReport.order_id == order_id)
        result = await db.execute(query)
        report = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error checking order {order_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred.")
        
    if not report:
        raise HTTPException(status_code=404, detail="Impact report not found")
        
    metrics = ImpactMetrics(
        plastic_saved_grams=report.plastic_saved_grams,
        carbon_avoided_kg=report.carbon_avoided_kg,
        local_sourcing_percent=report.local_sourcing_percent,
        trees_equivalent=report.trees_equivalent
    )
    
    products = [OrderProduct(**p) for p in report.products]
    
    return ImpactResponse(
        id=report.id,
        order_id=report.order_id,
        products=products,
        total_quantity=report.total_quantity,
        metrics=metrics,
        impact_statement=report.impact_statement,
        created_at=report.created_at
    )
