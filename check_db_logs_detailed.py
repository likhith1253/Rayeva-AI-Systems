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
        # Check PromptLog
        query_log = select(PromptLog).where(PromptLog.module_name == "impact")
        result_log = await session.execute(query_log)
        logs = result_log.scalars().all()
        
        for log in logs:
            if not log.success:
                print(f"FAILED LOG ERROR: {log.error_message}")

if __name__ == "__main__":
    asyncio.run(verify_db())
