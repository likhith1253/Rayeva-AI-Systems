"""
All prompts for the AI Auto-Category & Tag Generator.
Includes predefined constants, chain-of-thought prompt, and few-shot example.
"""

# ── Predefined Constants ──────────────────────────────────────────

PRIMARY_CATEGORIES = [
    "Food & Beverage",
    "Personal Care",
    "Home & Living",
    "Clothing & Apparel",
    "Office & Stationery",
    "Health & Wellness",
    "Baby & Kids",
    "Pet Care",
    "Garden & Outdoors",
    "Cleaning & Hygiene",
]

SUSTAINABILITY_FILTERS = [
    "plastic-free",
    "compostable",
    "vegan",
    "recycled-materials",
    "biodegradable",
    "organic",
    "fair-trade",
    "zero-waste",
    "locally-sourced",
    "energy-efficient",
    "reusable",
    "cruelty-free",
]

# ── System Prompt ─────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert product categorization AI for a sustainable commerce platform called Rayeva. Your job is to accurately categorize eco-friendly and sustainable products, generate relevant SEO tags, and identify applicable sustainability certifications.

You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no extra text before or after the JSON. Your entire response must be parseable as JSON."""

# ── Chain-of-Thought Categorization Prompt ────────────────────────

CATEGORIZE_PROMPT_TEMPLATE = """Analyze the following product and provide structured categorization data.

**Product Name:** {product_name}
**Product Description:** {description}

Follow this chain-of-thought reasoning process:

1. **Understand the product:** What is this product? Who is the target user? What is its primary purpose?

2. **Assign primary category:** Choose exactly ONE category from this predefined list:
{categories_list}
Select the category that best matches the product's primary use case.

3. **Suggest sub-category:** Provide a more specific sub-category within the primary category (e.g., if primary is "Personal Care", sub could be "Oral Hygiene" or "Skincare").

4. **Generate SEO tags:** Create 5-10 highly relevant SEO tags optimized for sustainable commerce search. Tags should include:
   - Product type keywords
   - Material/ingredient keywords
   - Sustainability-related search terms
   - Use-case keywords
   Tags must be lowercase, hyphenated where multi-word.

5. **Evaluate sustainability filters:** From this predefined list, select ONLY the filters that genuinely apply based on the product description. Do NOT guess or hallucinate filters — if the description does not clearly support a filter, do not include it.
Available filters: {filters_list}

6. **Confidence score:** Rate your confidence in the categorization from 0.0 to 1.0, where 1.0 means absolutely certain.

**FEW-SHOT EXAMPLE:**

Input:
- Product Name: "Bamboo Toothbrush"
- Description: "A 100% biodegradable bamboo toothbrush with charcoal-infused bristles. Comes in plastic-free kraft paper packaging. Suitable for sensitive gums. Handmade by artisans using sustainably harvested bamboo."

Output:
{{
  "primary_category": "Personal Care",
  "sub_category": "Oral Hygiene",
  "seo_tags": ["bamboo-toothbrush", "biodegradable-toothbrush", "eco-friendly-oral-care", "charcoal-bristle-brush", "plastic-free-toothbrush", "sustainable-dental-care", "zero-waste-bathroom", "natural-toothbrush"],
  "sustainability_filters": ["plastic-free", "biodegradable", "zero-waste", "compostable"],
  "confidence_score": 0.95
}}

Now analyze the product above and return ONLY a JSON object with these exact keys:
- "primary_category" (string — must be from the predefined list)
- "sub_category" (string)
- "seo_tags" (array of 5-10 strings)
- "sustainability_filters" (array of strings from the predefined list)
- "confidence_score" (float between 0.0 and 1.0)"""

# ── Stricter Retry Prompt (used when first attempt returns invalid JSON) ──

STRICT_RETRY_PROMPT = """Your previous response was not valid JSON. You MUST respond with ONLY a raw JSON object.

DO NOT include:
- Markdown code fences (```)
- Any text before or after the JSON
- Any explanation or commentary

Analyze this product and return ONLY a JSON object:

**Product Name:** {product_name}
**Product Description:** {description}

Required JSON structure:
{{
  "primary_category": "<one of: {categories_list}>",
  "sub_category": "<specific sub-category string>",
  "seo_tags": ["<tag1>", "<tag2>", "...(5-10 tags)"],
  "sustainability_filters": ["<filter1>", "...(from predefined list only)"],
  "confidence_score": <float 0.0-1.0>
}}

Predefined sustainability filters: {filters_list}

Respond with ONLY the JSON object. Nothing else."""


def build_categorize_prompt(product_name: str, description: str) -> str:
    """Build the full categorization prompt with predefined lists injected."""
    categories_str = "\n".join(f"   - {cat}" for cat in PRIMARY_CATEGORIES)
    filters_str = ", ".join(SUSTAINABILITY_FILTERS)

    return CATEGORIZE_PROMPT_TEMPLATE.format(
        product_name=product_name,
        description=description,
        categories_list=categories_str,
        filters_list=filters_str,
    )


def build_strict_retry_prompt(product_name: str, description: str) -> str:
    """Build the stricter retry prompt for when the first attempt fails."""
    categories_str = ", ".join(PRIMARY_CATEGORIES)
    filters_str = ", ".join(SUSTAINABILITY_FILTERS)

    return STRICT_RETRY_PROMPT.format(
        product_name=product_name,
        description=description,
        categories_list=categories_str,
        filters_list=filters_str,
    )
