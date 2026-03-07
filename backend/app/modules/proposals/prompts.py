def get_proposal_prompt(client_name: str, industry: str, budget: int, headcount: int, sustainability_priorities: list[str]) -> str:
    priorities_str = ", ".join(sustainability_priorities)
    
    return f"""You are an expert B2B sales strategist for Rayeva AI Systems, a sustainable commerce platform.
Your task is to generate a highly tailored, budget-conscious proposal for a prospective client.

CLIENT DETAILS:
- Client Name: {client_name}
- Industry: {industry}
- Budget: {budget} INR
- Headcount: {headcount} employees
- Sustainability Priorities: {priorities_str}

INSTRUCTIONS:
You must follow these steps before generating the final JSON:

Step 1: Analyze. Think about the {industry} industry and a headcount of {headcount}. What are their likely daily usage patterns for office supplies, pantry staples, personal care, or cleaning products?
Step 2: Select Products. Choose 4 to 7 sustainable products from the categories above that directly address their usage patterns and align with their priorities ({priorities_str}).
Step 3: Calculate. For each product, assign a realistic quantity based on headcount and a realistic unit price in INR. Ensure the total cost (sum of quantity * unit price for all products) does not exceed {budget} INR.
Step 4: Position. Write a 3-4 sentence impact positioning summary explaining why switching to these specific products matters for this client (touch on ESG reporting, employee wellness, or brand perception as relevant to their industry).
Step 5: Output ONLY valid JSON containing the exact schema requested below. Do not include any markdown fences, explanations, or thinking process in your final output.

EXPECTED JSON SCHEMA:
{{
  "proposed_products": [
    {{
      "name": "string (Product Name)",
      "category": "string (office supplies | pantry staples | personal care | cleaning products)",
      "quantity": integer,
      "unit_price": integer,
      "total_price": integer,
      "sustainability_benefit": "string (Brief specific benefit)",
      "why_recommended": "string (Reason tailored to client needs)"
    }}
  ],
  "impact_summary": "string (3-4 sentences, client-specific)"
}}

EXAMPLE:
Client Details:
- Client Name: GreenTech Solutions
- Industry: Technology
- Budget: 25000 INR
- Headcount: 50 employees
- Sustainability Priorities: Plastic Reduction, Employee Wellness

Output:
{{
  "proposed_products": [
    {{
      "name": "Bamboo Toilet Paper (48 Rolls)",
      "category": "personal care",
      "quantity": 10,
      "unit_price": 850,
      "total_price": 8500,
      "sustainability_benefit": "100% tree-free and biodegradable, saving approx 5 trees annually.",
      "why_recommended": "Essential for office bathrooms; supports wellness while drastically reducing paper waste."
    }},
    {{
      "name": "Fairtrade Organic Coffee Beans (1kg)",
      "category": "pantry staples",
      "quantity": 6,
      "unit_price": 1200,
      "total_price": 7200,
      "sustainability_benefit": "Ethically sourced with completely compostable packaging.",
      "why_recommended": "High daily consumption in tech offices makes sustainable coffee a high-impact swap."
    }},
    {{
      "name": "Reusable Glass Water Bottles",
      "category": "office supplies",
      "quantity": 50,
      "unit_price": 150,
      "total_price": 7500,
      "sustainability_benefit": "Eliminates single-use plastic water bottles.",
      "why_recommended": "One for each employee to promote hydration and achieve the plastic reduction goal."
    }},
    {{
      "name": "Eco-friendly Multi-surface Cleaner (5L)",
      "category": "cleaning products",
      "quantity": 2,
      "unit_price": 650,
      "total_price": 1300,
      "sustainability_benefit": "Non-toxic, plant-based ingredients in bulk recyclable containers.",
      "why_recommended": "Ensures a safe, chemical-free working environment for employees."
    }}
  ],
  "impact_summary": "By transitioning to these sustainable alternatives, GreenTech Solutions takes a definitive step toward its plastic reduction and employee wellness goals. Replacing single-use plastics and conventional paper products significantly lowers your office carbon footprint and provides tangible ESG talking points. Furthermore, providing eco-conscious pantry and restroom supplies reinforces a culture of care and sustainability, directly enhancing employee satisfaction and aligning with your identity as an forward-thinking technology company."
}}

Now, generate the proposal for {client_name}. Output ONLY the JSON.
"""
