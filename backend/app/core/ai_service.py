"""
Claude API wrapper using the Anthropic SDK.
Handles retries with exponential backoff, markdown fence stripping, and JSON parsing.
"""
import json
import re
import time
import logging
from typing import Optional

import anthropic

from backend.app.core.config import get_settings
from backend.app.core.exceptions import (
    AIServiceError,
    AIResponseParseError,
    AIRetryExhaustedError,
)

logger = logging.getLogger("rayeva.ai_service")
settings = get_settings()

# Regex to strip markdown code fences from AI responses
MARKDOWN_FENCE_RE = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)


def strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences from text, returning inner content."""
    match = MARKDOWN_FENCE_RE.search(text)
    if match:
        return match.group(1).strip()
    return text.strip()


async def call_claude(
    prompt: str,
    system_prompt: Optional[str] = None,
    max_tokens: Optional[int] = None,
    retries: int = 2,
) -> dict:
    """
    Call the Claude API with the given prompt.

    Args:
        prompt: The user message prompt.
        system_prompt: Optional system-level instruction.
        max_tokens: Max tokens for the response.
        retries: Number of retry attempts on failure.

    Returns:
        dict with keys:
            - "content": parsed JSON object from Claude's response
            - "raw_text": raw text response from Claude
            - "prompt_tokens": input token count
            - "response_tokens": output token count

    Raises:
        AIRetryExhaustedError: If all retries are exhausted.
        AIResponseParseError: If the response cannot be parsed as JSON.
        AIServiceError: For other API errors.
    """
    if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "sk-ant-api03-xxxxxxxxxxxxxxxx":
        logger.info("Using mocked AI response for testing since real API key is missing.")
        
        # Try to parse metrics from the prompt for dynamic impact statement
        psg = "0"
        cak = "0"
        trees = "0"
        import re
        psg_match = re.search(r'Plastic Saved\s*\(grams\):\s*([\d\.]+)', prompt)
        cak_match = re.search(r'Carbon Avoided\s*\(kg\):\s*([\d\.]+)', prompt)
        trees_match = re.search(r'Trees Equivalent:\s*([\d\.]+)', prompt)
        
        if psg_match: psg = psg_match.group(1)
        if cak_match: cak = cak_match.group(1)
        if trees_match: trees = trees_match.group(1)
        
        impact_stmt = f"This order saved {psg}g of plastic and avoided {cak}kg of carbon emissions through sustainable product choices. It's equivalent to planting {trees} trees."

        # Return a mock response
        mock_json_content = {
            "proposed_products": [
                {
                    "name": "Bamboo Toilet Paper (48 Rolls)",
                    "category": "personal care",
                    "quantity": 10,
                    "unit_price": 850,
                    "total_price": 8500,
                    "sustainability_benefit": "100% tree-free and biodegradable, saving approx 5 trees annually.",
                    "why_recommended": "Essential for office bathrooms; supports wellness while drastically reducing paper waste."
                },
                {
                    "name": "Fairtrade Organic Coffee Beans (1kg)",
                    "category": "pantry staples",
                    "quantity": 6,
                    "unit_price": 1200,
                    "total_price": 7200,
                    "sustainability_benefit": "Ethically sourced with completely compostable packaging.",
                    "why_recommended": "High daily consumption in tech offices makes sustainable coffee a high-impact swap."
                },
                {
                    "name": "Reusable Glass Water Bottles",
                    "category": "office supplies",
                    "quantity": 50,
                    "unit_price": 150,
                    "total_price": 7500,
                    "sustainability_benefit": "Eliminates single-use plastic water bottles.",
                    "why_recommended": "One for each employee to promote hydration and achieve the plastic reduction goal."
                },
                {
                    "name": "Eco-friendly Multi-surface Cleaner (5L)",
                    "category": "cleaning products",
                    "quantity": 2,
                    "unit_price": 650,
                    "total_price": 1300,
                    "sustainability_benefit": "Non-toxic, plant-based ingredients in bulk recyclable containers.",
                    "why_recommended": "Ensures a safe, chemical-free working environment for employees."
                }
            ],
            "impact_summary": "By transitioning to these sustainable alternatives, we take a definitive step toward our plastic reduction and employee wellness goals. Replacing single-use plastics and conventional paper products significantly lowers our office carbon footprint and provides tangible ESG talking points. Furthermore, providing eco-conscious pantry and restroom supplies reinforces a culture of care and sustainability.",
            "impact_statement": impact_stmt
        }
        return {
            "content": mock_json_content,
            "raw_text": json.dumps(mock_json_content),
            "prompt_tokens": 120,
            "response_tokens": 300,
        }

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    model = settings.AI_MODEL
    tokens = max_tokens or settings.AI_MAX_TOKENS

    last_exception = None
    attempt = 0

    while attempt <= retries:
        try:
            start_time = time.time()

            kwargs = {
                "model": model,
                "max_tokens": tokens,
                "messages": [{"role": "user", "content": prompt}],
            }
            if system_prompt:
                kwargs["system"] = system_prompt

            response = await client.messages.create(**kwargs)
            elapsed_ms = int((time.time() - start_time) * 1000)

            raw_text = response.content[0].text
            prompt_tokens = response.usage.input_tokens
            response_tokens = response.usage.output_tokens

            logger.info(
                "Claude API call succeeded | model=%s | prompt_tokens=%d | response_tokens=%d | latency=%dms",
                model, prompt_tokens, response_tokens, elapsed_ms,
            )

            # Strip markdown fences and parse JSON
            cleaned = strip_markdown_fences(raw_text)
            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError as e:
                raise AIResponseParseError(
                    raw_response=raw_text,
                    message=f"Failed to parse AI response as JSON: {str(e)}",
                )

            return {
                "content": parsed,
                "raw_text": raw_text,
                "prompt_tokens": prompt_tokens,
                "response_tokens": response_tokens,
            }

        except AIResponseParseError:
            # Don't retry parse errors here — let the caller handle retry with stricter prompt
            raise
        except anthropic.APIStatusError as e:
            last_exception = e
            attempt += 1
            if attempt <= retries:
                wait_time = 2 ** attempt  # Exponential backoff: 2s, 4s
                logger.warning(
                    "Claude API error (attempt %d/%d), retrying in %ds: %s",
                    attempt, retries + 1, wait_time, str(e),
                )
                import asyncio
                await asyncio.sleep(wait_time)
            else:
                logger.error("Claude API error after all retries: %s", str(e))
        except anthropic.APIConnectionError as e:
            last_exception = e
            attempt += 1
            if attempt <= retries:
                wait_time = 2 ** attempt
                logger.warning(
                    "Claude API connection error (attempt %d/%d), retrying in %ds: %s",
                    attempt, retries + 1, wait_time, str(e),
                )
                import asyncio
                await asyncio.sleep(wait_time)
            else:
                logger.error("Claude API connection error after all retries: %s", str(e))
        except Exception as e:
            logger.error("Unexpected error calling Claude API: %s", str(e))
            raise AIServiceError(f"Unexpected error: {str(e)}")

    raise AIRetryExhaustedError(
        attempts=retries + 1,
        message=f"Claude API call failed: {str(last_exception)}",
    )
