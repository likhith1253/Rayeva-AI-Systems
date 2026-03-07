import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from backend.app.core.config import get_settings
from backend.app.core.logger import PromptLog

settings = get_settings()

async def read_logs():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        query_log = select(PromptLog).where(PromptLog.module_name == "impact").order_by(PromptLog.id.desc()).limit(1)
        result_log = await session.execute(query_log)
        log = result_log.scalar_one_or_none()
        
        if log:
            print("=== PROMPT ===")
            print(log.prompt_sent)
            print("=== AI RESPONSE ===")
            print(log.raw_response)

if __name__ == "__main__":
    asyncio.run(read_logs())
