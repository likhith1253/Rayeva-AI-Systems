import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_module(name, endpoint, payload):
    print(f"--- Testing {name} ---")
    try:
        res = requests.post(f"{BASE_URL}{endpoint}", json=payload)
        print(f"STATUS: {res.status_code}")
        if res.status_code == 200:
            print("SUCCESS")
            # print(json.dumps(res.json(), indent=2))
            return True
        else:
            print(f"FAILURE: {res.text}")
            return False
    except Exception as e:
        print(f"EXCEPT: {e}")
        return False

# Module 1 - Catalog
catalog_payload = {
    "product_name": "Bamboo Toothbrush", 
    "description": "An eco-friendly toothbrush made from sustainable bamboo with naturally biodegradable handle and soft bristles"
}

# Module 2 - Proposals
proposals_payload = {
    "client_name": "EcoTech India", 
    "industry": "Technology", 
    "budget": 30000, 
    "headcount": 60, 
    "sustainability_priorities": ["Plastic Reduction", "Employee Wellness"]
}

# Module 3 - Impact
import random
import string
random_order = "ORD-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
impact_payload = {
    "order_id": random_order, 
    "products": [
        {"name": "Bamboo Toothbrush", "category": "Personal Care", "quantity": 10, "is_sustainable": True, "weight_grams": 15, "is_local": True}, 
        {"name": "Organic Soap", "category": "Personal Care", "quantity": 5, "is_sustainable": True, "weight_grams": 100, "is_local": False}
    ]
}

# Module 4 - Support
support_payload = {
    "session_id": "api-key-verify-001", 
    "message": "Where is my order ORD-001?"
}

print("Running E2E Mocked Quota Limit API Tests...")

results = []
results.append(test_module("Catalog", "/api/catalog/categorize", catalog_payload))
results.append(test_module("Proposals", "/api/proposals/generate", proposals_payload))
results.append(test_module("Impact", "/api/impact/generate", impact_payload))
results.append(test_module("Support", "/api/support/chat", support_payload))

if all(results):
    print("\nALL MODULES PASSED")
else:
    print("\nSOME MODULES FAILED")
