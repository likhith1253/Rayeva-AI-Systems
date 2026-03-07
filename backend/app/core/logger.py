"""
AI interaction logger — logs every AI call to a `prompt_logs` database table.
Also configures Python logging for console output.
"""
import logging
import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import Base


# ── SQLAlchemy Model ──────────────────────────────────────────────

class PromptLog(Base):
    """Stores every AI interaction for auditing and debugging."""

    __tablename__ = "prompt_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    module_name = Column(String(50), nullable=False, index=True)
    input_payload = Column(JSON, nullable=True)
    prompt_sent = Column(Text, nullable=True)
    raw_response = Column(Text, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


# ── Logging Function ─────────────────────────────────────────────

async def log_ai_interaction(
    db: AsyncSession,
    module_name: str,
    input_payload: Optional[dict] = None,
    prompt_sent: Optional[str] = None,
    raw_response: Optional[str] = None,
    tokens_used: Optional[int] = None,
    latency_ms: Optional[int] = None,
    success: bool = True,
    error_message: Optional[str] = None,
) -> None:
    """
    Log an AI interaction to the prompt_logs table.

    Args:
        db: Async database session.
        module_name: Name of the module making the AI call (e.g. 'catalog').
        input_payload: The request payload sent by the user.
        prompt_sent: The full prompt sent to the AI.
        raw_response: The raw text response from the AI.
        tokens_used: Total tokens consumed (prompt + response).
        latency_ms: Time taken for the AI call in milliseconds.
        success: Whether the call succeeded.
        error_message: Error message if the call failed.
    """
    try:
        log_entry = PromptLog(
            module_name=module_name,
            input_payload=input_payload,
            prompt_sent=prompt_sent,
            raw_response=raw_response,
            tokens_used=tokens_used,
            latency_ms=latency_ms,
            success=success,
            error_message=error_message,
        )
        db.add(log_entry)
        await db.flush()
    except Exception as e:
        # Don't let logging failures break the main flow
        logging.getLogger("rayeva.logger").error(
            "Failed to log AI interaction: %s", str(e)
        )


# ── Console Logging Setup ────────────────────────────────────────

def setup_logging(level: str = "INFO") -> None:
    """Configure structured console logging for the application."""
    log_level = getattr(logging, level.upper(), logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    root_logger = logging.getLogger("rayeva")
    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)

    # Reduce SQLAlchemy noise
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
