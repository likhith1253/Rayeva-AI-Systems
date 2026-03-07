import json

def get_impact_prompt(order_id: str, products: list, metrics: dict) -> str:
    return f"""You are an environmental impact analyst for a sustainable commerce platform. Your job is to write a warm, positive, and motivating impact statement for a specific customer order.

You have been provided with the order details and pre-calculated environmental impact metrics. These metrics are already calculated and you must use exactly these numbers, do not invent new ones.

ORDER DETAILS:
Order ID: {order_id}
Products: {json.dumps(products)}

PRE-CALCULATED METRICS:
Plastic Saved (grams): {metrics.get('plastic_saved_grams', 0)}
Carbon Avoided (kg): {metrics.get('carbon_avoided_kg', 0)}
Local Sourcing Percent: {metrics.get('local_sourcing_percent', 0)}%
Trees Equivalent: {metrics.get('trees_equivalent', 0)}

INSTRUCTIONS:
Write a human-readable impact statement of 3-4 sentences that:
1. Mentions the specific products by name.
2. Uses the exact metric numbers provided.
3. Is warm, positive, and motivating in tone.
4. Feels personal to this specific order, not generic.
5. Ends with the real-world equivalent (e.g., trees equivalent, plastic bottles, car miles) to make the numbers tangible.

OUTPUT FORMAT REQUIREMENTS:
Return ONLY a JSON object with exactly one field: "impact_statement" (a string).
Do NOT include markdown fences, code blocks, or any other formatting or explanations. Just the raw JSON object.

EXAMPLE:

INPUT:
Order ID: 12345
Products: [{{"name": "bamboo toothbrushes", "quantity": 10}}, {{"name": "organic soaps", "quantity": 5}}]
Metrics: {{"plastic_saved_grams": 450, "carbon_avoided_kg": 2.3, "local_sourcing_percent": 80, "trees_equivalent": 0.3}}

OUTPUT:
{{
  "impact_statement": "Thank you for supporting sustainability by purchasing 10 bamboo toothbrushes and 5 organic soaps! Your order has made a real difference by saving 450 grams of plastic and avoiding 2.3 kg of carbon emissions. With 80% of your items sourced locally, your positive choices are equivalent to planting 0.3 trees!"
}}

Now, generate the response for the provided input:
"""
