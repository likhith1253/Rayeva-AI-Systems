import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete

from backend.app.core.config import get_settings
from backend.app.modules.impact.models import ImpactReport
from backend.app.core.logger import PromptLog

settings = get_settings()

async def clean_db():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        await session.execute(delete(ImpactReport).where(ImpactReport.order_id == "ORD-2024-001"))
        await session.execute(delete(PromptLog).where(PromptLog.module_name == "impact"))
        await session.commit()
        print("Database cleaned.")

if __name__ == "__main__":
    asyncio.run(clean_db())
