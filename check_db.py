import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from backend.app.core.config import get_settings
from backend.app.modules.impact.models import ImpactReport
from backend.app.core.logger import PromptLog

settings = get_settings()

async def verify_db():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check ImpactReport
        query = select(ImpactReport).where(ImpactReport.order_id == "ORD-2024-001")
        result = await session.execute(query)
        report = result.scalar_one_or_none()
        
        assert report is not None, "Report not found in DB"
        assert abs(report.plastic_saved_grams - 390.0) < 0.01, f"DB Plastic saved: {report.plastic_saved_grams}"
        assert abs(report.carbon_avoided_kg - 2.34) < 0.01, f"DB Carbon avoided: {report.carbon_avoided_kg}"
        assert abs(report.local_sourcing_percent - 33.33) < 0.02, f"DB Local percent: {report.local_sourcing_percent}"
        assert report.impact_statement, "Empty impact statement in DB"
        assert report.raw_ai_response, "Empty raw_ai_response in DB"
        assert report.prompt_tokens > 0, "No prompt tokens"
        assert report.response_tokens > 0, "No response tokens"
        assert report.created_at, "No created_at"
        
        print("ImpactReport DB verification PASSED.")
        
        # Check PromptLog
        query_log = select(PromptLog).where(PromptLog.module_name == "impact")
        result_log = await session.execute(query_log)
        logs = result_log.scalars().all()
        
        # Since we ran the test a few times, there may be more than 1 log. We just need to ensure at least 1 valid log exists.
        assert len(logs) > 0, "No prompt logs found for impact module"
        log = logs[-1] # Check the latest one
        assert log.success is True, "Latest log is not success"
        assert log.latency_ms > 0, "Latency is not positive"
        assert '"order_id": "ORD-2024-001"' in log.input_payload or log.input_payload.get('order_id') == "ORD-2024-001", "Payload mismatch"
        
        print("PromptLog DB verification PASSED.")
        
if __name__ == "__main__":
    asyncio.run(verify_db())
