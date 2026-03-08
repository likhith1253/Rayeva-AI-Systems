import traceback
import asyncio

async def main():
    from backend.app.core.database import engine, Base
    import backend.app.modules.support.models

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    from backend.app.modules.support.schemas import ChatMessage
    from backend.app.modules.support.service import process_message

    async with AsyncSessionLocal() as db:
        try:
            result = await process_message(
                ChatMessage(session_id='debug-test-3', message='Hello'),
                db
            )
            print("SUCCESS")
            print(f"reply={result.reply[:60]}")
            print(f"intent={result.intent}")
            print(f"escalated={result.escalated}")
        except Exception:
            print("FAILED")
            traceback.print_exc()

asyncio.run(main())
