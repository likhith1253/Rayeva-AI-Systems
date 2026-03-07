"""
Business logic for the AI Auto-Category & Tag Generator.
Validates input, calls the AI service, post-processes output, and saves to DB.
"""
import time
import json
import logging
from difflib import SequenceMatcher
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.ai_service import call_claude
from backend.app.core.logger import log_ai_interaction
from backend.app.core.exceptions import (
    AIResponseParseError,
    AIServiceError,
)
from backend.app.modules.catalog.models import CatalogEntry
from backend.app.modules.catalog.prompts import (
    PRIMARY_CATEGORIES,
    SUSTAINABILITY_FILTERS,
    SYSTEM_PROMPT,
    build_categorize_prompt,
    build_strict_retry_prompt,
)
from backend.app.modules.catalog.schemas import CategorizeRequest

logger = logging.getLogger("rayeva.catalog.service")


def find_closest_category(candidate: str) -> str:
    """
    Find the closest matching category from the predefined list using
    simple string similarity (SequenceMatcher).
    Returns the best match, or the first category if nothing is close.
    """
    best_match = PRIMARY_CATEGORIES[0]
    best_score = 0.0

    candidate_lower = candidate.lower().strip()
    for cat in PRIMARY_CATEGORIES:
        score = SequenceMatcher(None, candidate_lower, cat.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = cat

    logger.info(
        "Category matching: '%s' → '%s' (similarity: %.2f)",
        candidate, best_match, best_score,
    )
    return best_match


def validate_sustainability_filters(filters: list) -> List[str]:
    """Keep only filters that exist in the predefined list."""
    valid = [f for f in filters if f in SUSTAINABILITY_FILTERS]
    return valid


def post_process_ai_response(data: dict) -> dict:
    """
    Post-process the AI response to enforce constraints:
    - primary_category must be from predefined list
    - sustainability_filters must be from predefined list
    - seo_tags capped at 10
    - confidence_score clamped to [0, 1]
    """
    # Snap primary_category to closest match
    raw_category = data.get("primary_category", "")
    if raw_category not in PRIMARY_CATEGORIES:
        data["primary_category"] = find_closest_category(raw_category)
    
    # Validate sustainability filters
    raw_filters = data.get("sustainability_filters", [])
    data["sustainability_filters"] = validate_sustainability_filters(raw_filters)

    # Ensure seo_tags is a list of strings, capped at 10
    raw_tags = data.get("seo_tags", [])
    if isinstance(raw_tags, list):
        data["seo_tags"] = [str(t) for t in raw_tags[:10]]
    else:
        data["seo_tags"] = []

    # Clamp confidence score
    try:
        score = float(data.get("confidence_score", 0.5))
        data["confidence_score"] = max(0.0, min(1.0, score))
    except (ValueError, TypeError):
        data["confidence_score"] = 0.5

    # Ensure sub_category is a string
    data["sub_category"] = str(data.get("sub_category", "General"))

    return data


async def categorize_product(
    db: AsyncSession,
    request: CategorizeRequest,
) -> CatalogEntry:
    """
    Main business logic: categorize a product using Claude AI.

    1. Build prompt
    2. Call Claude API
    3. If invalid JSON, retry once with stricter prompt
    4. Post-process response
    5. Save to DB
    6. Log the interaction
    """
    start_time = time.time()
    prompt = build_categorize_prompt(request.product_name, request.description)
    input_payload = {
        "product_name": request.product_name,
        "description": request.description,
    }

    ai_result = None
    parsed_data = None
    error_msg = None

    try:
        # First attempt
        try:
            ai_result = await call_claude(prompt=prompt, system_prompt=SYSTEM_PROMPT)
            parsed_data = ai_result["content"]
        except AIResponseParseError as e:
            # Retry once with a stricter prompt
            logger.warning("First attempt returned invalid JSON, retrying with stricter prompt")
            strict_prompt = build_strict_retry_prompt(
                request.product_name, request.description
            )
            ai_result = await call_claude(prompt=strict_prompt, system_prompt=SYSTEM_PROMPT)
            parsed_data = ai_result["content"]

        # Post-process the response
        parsed_data = post_process_ai_response(parsed_data)

        # Create and save the catalog entry
        entry = CatalogEntry(
            product_name=request.product_name,
            description=request.description,
            primary_category=parsed_data["primary_category"],
            sub_category=parsed_data.get("sub_category"),
            seo_tags=parsed_data.get("seo_tags", []),
            sustainability_filters=parsed_data.get("sustainability_filters", []),
            confidence_score=parsed_data.get("confidence_score", 0.5),
            raw_ai_response=ai_result.get("raw_text", ""),
            prompt_tokens=ai_result.get("prompt_tokens", 0),
            response_tokens=ai_result.get("response_tokens", 0),
        )
        db.add(entry)
        await db.flush()
        await db.refresh(entry)

        # Log successful interaction
        elapsed_ms = int((time.time() - start_time) * 1000)
        await log_ai_interaction(
            db=db,
            module_name="catalog",
            input_payload=input_payload,
            prompt_sent=prompt,
            raw_response=ai_result.get("raw_text", ""),
            tokens_used=(ai_result.get("prompt_tokens", 0) + ai_result.get("response_tokens", 0)),
            latency_ms=elapsed_ms,
            success=True,
        )

        return entry

    except Exception as e:
        # Log failed interaction
        elapsed_ms = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        logger.error("Categorization failed: %s", error_msg)

        await log_ai_interaction(
            db=db,
            module_name="catalog",
            input_payload=input_payload,
            prompt_sent=prompt,
            raw_response=ai_result.get("raw_text", "") if ai_result else None,
            tokens_used=None,
            latency_ms=elapsed_ms,
            success=False,
            error_message=error_msg,
        )
        raise AIServiceError(f"Failed to categorize product: {error_msg}")


async def get_history(db: AsyncSession, limit: int = 20) -> List[CatalogEntry]:
    """Retrieve the last N categorized products, ordered by most recent first."""
    result = await db.execute(
        select(CatalogEntry)
        .order_by(CatalogEntry.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


def get_categories() -> dict:
    """Return the predefined categories and sustainability filters."""
    return {
        "primary_categories": PRIMARY_CATEGORIES,
        "sustainability_filters": SUSTAINABILITY_FILTERS,
    }
