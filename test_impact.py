import requests
import json
import traceback
import sys

BASE_URL = "http://localhost:8000/api/impact"

def test_api():
    print("Starting API tests...")
    
    # Test 1 - POST valid data
    print("\n--- TEST 1: POST /api/impact/generate ---")
    payload = {
      "order_id": "ORD-2024-001",
      "products": [
        {"name": "Bamboo Toothbrush", "category": "Personal Care", "quantity": 10, "is_sustainable": True, "weight_grams": 15, "is_local": True},
        {"name": "Organic Soap", "category": "Personal Care", "quantity": 5, "is_sustainable": True, "weight_grams": 100, "is_local": False},
        {"name": "Regular Pen", "category": "Office", "quantity": 20, "is_sustainable": False, "weight_grams": 10, "is_local": False}
      ]
    }
    try:
        res = requests.post(f"{BASE_URL}/generate", json=payload)
        res.raise_for_status()
        data1 = res.json()
        print("Success! Response metrics:", data1.get("metrics"))
        assert data1["total_quantity"] == 35, "Total quantity mismatch"
        assert len(data1["impact_statement"]) > 0, "Empty impact statement"
    except Exception as e:
        print("Test 1 FAILED:", e)
        print("Response:", res.text if 'res' in locals() else "None")
        sys.exit(1)

    # Test 2 - Verify Metrics
    print("\n--- TEST 2: Verify calculations manually ---")
    metrics = data1.get("metrics", {})
    plastic = metrics.get("plastic_saved_grams")
    carbon = metrics.get("carbon_avoided_kg")
    local = metrics.get("local_sourcing_percent")
    trees = metrics.get("trees_equivalent")

    assert abs(plastic - 390.0) < 0.01, f"Expected plastic 390.0, got {plastic}"
    assert abs(carbon - 2.34) < 0.01, f"Expected carbon 2.34, got {carbon}"
    assert abs(local - 33.33) < 0.02, f"Expected local ~33.33, got {local}"
    assert abs(trees - 0.1075) < 0.01, f"Expected trees 0.1075, got {trees}"
    print("Test 2 PASSED: All metrics perfectly matched mathematical expectations.")

    # Test 3 - POST same order_id
    print("\n--- TEST 3: Duplicate order cached ---")
    res3 = requests.post(f"{BASE_URL}/generate", json=payload)
    data3 = res3.json()
    assert data1["id"] == data3["id"], "Expected matching DB IDs (cached)"
    print("Test 3 PASSED: System returned cached response successfully.")

    # Test 4 - Invalid empty products
    print("\n--- TEST 4: POST with empty products ---")
    try:
        res4 = requests.post(f"{BASE_URL}/generate", json={"order_id": "ORD-BAD-001", "products": []})
        assert res4.status_code == 422, f"Expected 422, got {res4.status_code}"
        print("Test 4 PASSED")
    except Exception as e:
        print("Test 4 FAILED:", e)
        sys.exit(1)

    # Test 5 - Invalid 0 quantity
    print("\n--- TEST 5: POST with 0 quantity ---")
    try:
        res5 = requests.post(f"{BASE_URL}/generate", json={"order_id": "ORD-BAD-002", "products": [{"name": "Test", "category": "Test", "quantity": 0, "is_sustainable": True, "weight_grams": 10, "is_local": False}]})
        assert res5.status_code == 422, f"Expected 422, got {res5.status_code}"
        print("Test 5 PASSED")
    except Exception as e:
        print("Test 5 FAILED:", e)
        sys.exit(1)

    # Test 6 - GET history
    print("\n--- TEST 6: GET /history ---")
    res6 = requests.get(f"{BASE_URL}/history")
    hist_data = res6.json()
    assert any(h["order_id"] == "ORD-2024-001" for h in hist_data), "Order missing from history"
    # check order
    if len(hist_data) >= 2:
        assert hist_data[0]["created_at"] >= hist_data[1]["created_at"], "History not ordered by recent first"
    print("Test 6 PASSED")

    # Test 7 - GET by order_id
    print("\n--- TEST 7: GET /ORD-2024-001 ---")
    res7 = requests.get(f"{BASE_URL}/ORD-2024-001")
    data7 = res7.json()
    assert data7["order_id"] == "ORD-2024-001", "Order ID mismatch"
    assert data7["id"] == data1["id"], "ID mismatch"
    print("Test 7 PASSED")

    # Test 8 - GET 404
    print("\n--- TEST 8: GET Nonexistent 404 ---")
    res8 = requests.get(f"{BASE_URL}/NONEXISTENT-ORDER-999")
    assert res8.status_code == 404, f"Expected 404, got {res8.status_code}"
    print("Test 8 PASSED: Correctly returned 404 for missing order.")

    print("\nALL BACKEND API TESTS COMPLETED AND PASSED!")

if __name__ == "__main__":
    test_api()
