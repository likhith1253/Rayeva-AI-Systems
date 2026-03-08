import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.modules.support.schemas import ChatMessage
from backend.app.modules.support.service import process_message

engine = create_async_engine('sqlite+aiosqlite:///./dev.db')
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def t():
    async with AsyncSessionLocal() as db:
        return await process_message(ChatMessage(session_id='verify', message='test'), db)

if __name__ == '__main__':
    print(asyncio.run(t()))
