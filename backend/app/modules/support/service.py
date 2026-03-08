import json
import time
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, desc

from backend.app.modules.support.models import Conversation, EscalationLog
from backend.app.modules.support.schemas import ChatMessage, ChatResponse, SessionHistory, ConversationEntry, EscalationEntry
from backend.app.modules.support.prompts import get_support_prompt
from backend.app.modules.support.mock_data import MOCK_ORDERS
from backend.app.core.ai_service import call_claude
from backend.app.core.logger import log_ai_interaction

logger = logging.getLogger("rayeva.support")

FALLBACK_REPLY = (
    "I'm having trouble processing your request right now. "
    "Please try again in a moment or email support@rayeva.com"
)


def _safe_str(value) -> str:
    """Ensure a value is always a string for DB storage."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return json.dumps(value, default=str)


def _parse_ai_payload(claude_res: dict) -> tuple:
    """
    Extract structured payload from call_claude response.
    Returns (payload_dict, raw_text_str, prompt_tokens, response_tokens).
    Raises ValueError if JSON parsing fails.
    """
    content = claude_res.get("content", "")
    raw_text = claude_res.get("raw_text", "")
    prompt_tokens = claude_res.get("prompt_tokens", 0)
    response_tokens = claude_res.get("response_tokens", 0)

    # call_claude already parses JSON into content. If it's a dict, use it directly
    # BUT we need to validate it has the expected support-bot keys
    if isinstance(content, dict) and "reply" in content:
        return content, _safe_str(raw_text), prompt_tokens, response_tokens

    # If content is a dict but doesn't have our keys (e.g. mock from another module),
    # try parsing raw_text instead
    text_to_parse = _safe_str(raw_text) if raw_text else _safe_str(content)

    # Strip markdown fences
    clean = text_to_parse.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    elif clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()

    parsed = json.loads(clean)
    if not isinstance(parsed, dict) or "reply" not in parsed:
        raise ValueError("AI response missing required 'reply' field")
    return parsed, _safe_str(raw_text), prompt_tokens, response_tokens


async def process_message(request: ChatMessage, db: AsyncSession) -> ChatResponse:
    start_time = time.time()

    # Save user message first
    user_conv = Conversation(
        session_id=request.session_id,
        role="user",
        message=request.message
    )
    db.add(user_conv)
    await db.commit()

    # 1. Fetch last 10 messages for this session
    query = (
        select(Conversation)
        .where(Conversation.session_id == request.session_id)
        .order_by(desc(Conversation.created_at))
        .limit(10)
    )
    result = await db.execute(query)
    last_10 = result.scalars().all()

    # Reverse so they are in chronological order for the prompt
    conversation_history = [
        {"role": msg.role, "content": msg.message}
        for msg in reversed(last_10)
    ]

    # 2. Build prompt
    prompt = get_support_prompt(request.message, conversation_history, MOCK_ORDERS)

    payload = {}
    tokens_used = 0
    prompt_tokens = 0
    res_tokens = 0
    raw_resp = ""
    error_msg = None
    success = False

    # 3 & 4. Call claude and parse JSON with 1 retry
    for attempt in range(2):
        try:
            claude_res = await call_claude(prompt)
            payload, raw_resp, prompt_tokens, res_tokens = _parse_ai_payload(claude_res)
            tokens_used = prompt_tokens + res_tokens
            success = True
            break
        except Exception as e:
            error_msg = str(e)
            logger.warning("AI call attempt %d failed: %s", attempt + 1, error_msg)
            success = False

    # Handle failures after retries
    if not success:
        payload = {
            "reply": FALLBACK_REPLY,
            "intent": "general",
            "escalated": False,
            "escalation_reason": None,
            "suggested_actions": ["Try again", "Email support"]
        }

    # 6. Save assistant reply
    asst_conv = Conversation(
        session_id=request.session_id,
        role="assistant",
        message=payload.get("reply", ""),
        intent=payload.get("intent", "general"),
        escalated=bool(payload.get("escalated", False)),
        escalation_reason=payload.get("escalation_reason"),
        raw_ai_response=_safe_str(raw_resp),
        prompt_tokens=prompt_tokens,
        response_tokens=res_tokens
    )
    db.add(asst_conv)
    await db.commit()

    # 7. Escalate if needed
    if payload.get("escalated"):
        esc = EscalationLog(
            session_id=request.session_id,
            reason=payload.get("escalation_reason") or "User requires human assistance",
            user_message=request.message
        )
        db.add(esc)
        await db.commit()

    latency_ms = int((time.time() - start_time) * 1000)

    # 8. Log interaction
    try:
        await log_ai_interaction(
            db=db,
            module_name="support",
            input_payload=request.model_dump(),
            prompt_sent=prompt,
            raw_response=_safe_str(raw_resp),
            tokens_used=tokens_used,
            latency_ms=latency_ms,
            success=success,
            error_message=error_msg
        )
    except Exception as log_err:
        logger.error("Failed to log interaction: %s", str(log_err))

    # 9. Return ChatResponse
    return ChatResponse(
        session_id=request.session_id,
        reply=payload.get("reply", ""),
        intent=payload.get("intent", "general"),
        escalated=bool(payload.get("escalated", False)),
        escalation_reason=payload.get("escalation_reason"),
        suggested_actions=payload.get("suggested_actions", [])
    )


async def get_session_history(session_id: str, db: AsyncSession) -> SessionHistory:
    query = (
        select(Conversation)
        .where(Conversation.session_id == session_id)
        .order_by(Conversation.created_at.asc())
    )
    result = await db.execute(query)
    messages = result.scalars().all()

    has_esc = any(m.escalated for m in messages)
    entries = [ConversationEntry.model_validate(m) for m in messages]

    return SessionHistory(
        session_id=session_id,
        messages=entries,
        total_messages=len(entries),
        has_escalation=has_esc
    )


async def get_all_escalations(db: AsyncSession) -> list[EscalationEntry]:
    query = select(EscalationLog).order_by(desc(EscalationLog.created_at))
    result = await db.execute(query)
    logs = result.scalars().all()
    return [EscalationEntry.model_validate(log) for log in logs]


async def clear_session(session_id: str, db: AsyncSession) -> dict:
    query = delete(Conversation).where(Conversation.session_id == session_id)
    await db.execute(query)
    await db.commit()
    return {"cleared": True, "session_id": session_id}
