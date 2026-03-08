import requests
import json
import time

BASE_URL = "http://localhost:8000/api/support"

f = open('test_output.txt', 'w')

def log(msg):
    f.write(msg + '\n')
    f.flush()

log("--- Running Support Bot End-to-End Tests ---")

# Test 1
try:
    res1 = requests.post(f"{BASE_URL}/chat", json={
        "session_id": "verify-session-001",
        "message": "Where is my order ORD-801?"
    })
    data1 = res1.json()
    log(f"Test 1: status={res1.status_code} reply_len={len(data1.get('reply',''))} intent={data1.get('intent')} escalated={data1.get('escalated')} actions={data1.get('suggested_actions')}")
except Exception as e:
    log(f"Test 1: ERROR {e}")

# Test 2
try:
    res2 = requests.post(f"{BASE_URL}/chat", json={
        "session_id": "verify-session-001",
        "message": "How many days do I have to return a product?"
    })
    data2 = res2.json()
    log(f"Test 2: status={res2.status_code} reply_len={len(data2.get('reply',''))} intent={data2.get('intent')} escalated={data2.get('escalated')} has_7days={'7' in data2.get('reply','')}")
except Exception as e:
    log(f"Test 2: ERROR {e}")

# Test 3
try:
    requests.post(f"{BASE_URL}/chat", json={
        "session_id": "verify-session-002",
        "message": "Hi my name is Priya and I ordered bamboo toothbrushes"
    })
    res3 = requests.post(f"{BASE_URL}/chat", json={
        "session_id": "verify-session-002",
        "message": "What did I just order?"
    })
    data3 = res3.json()
    log(f"Test 3: status={res3.status_code} reply={data3.get('reply','')[:100]}")
except Exception as e:
    log(f"Test 3: ERROR {e}")

# Test 4
try:
    res4 = requests.post(f"{BASE_URL}/chat", json={
        "session_id": "verify-session-003",
        "message": "I want a refund immediately this product is terrible and I will take legal action"
    })
    data4 = res4.json()
    log(f"Test 4: status={res4.status_code} escalated={data4.get('escalated')} reason={data4.get('escalation_reason')} intent={data4.get('intent')}")
except Exception as e:
    log(f"Test 4: ERROR {e}")

# Test 5
try:
    res5 = requests.post(f"{BASE_URL}/chat", json={
        "session_id": "verify-session-004",
        "message": "This is completely unacceptable I need to speak to a manager right now"
    })
    data5 = res5.json()
    log(f"Test 5: status={res5.status_code} escalated={data5.get('escalated')} reason={data5.get('escalation_reason')} intent={data5.get('intent')}")
except Exception as e:
    log(f"Test 5: ERROR {e}")

# Test 6
try:
    res6 = requests.post(f"{BASE_URL}/chat", json={
        "session_id": "verify-session-005",
        "message": "Tell me about your sustainable products"
    })
    data6 = res6.json()
    log(f"Test 6: status={res6.status_code} escalated={data6.get('escalated')} intent={data6.get('intent')}")
except Exception as e:
    log(f"Test 6: ERROR {e}")

# Test 7
try:
    res7 = requests.get(f"{BASE_URL}/history/verify-session-001")
    data7 = res7.json()
    log(f"Test 7: status={res7.status_code} total={data7.get('total_messages')} has_esc={data7.get('has_escalation')}")
except Exception as e:
    log(f"Test 7: ERROR {e}")

# Test 8
try:
    res8 = requests.get(f"{BASE_URL}/history/verify-session-003")
    data8 = res8.json()
    log(f"Test 8: status={res8.status_code} total={data8.get('total_messages')} has_esc={data8.get('has_escalation')}")
except Exception as e:
    log(f"Test 8: ERROR {e}")

# Test 9
try:
    res9 = requests.get(f"{BASE_URL}/escalations")
    data9 = res9.json()
    session_ids = [e.get('session_id') for e in data9]
    log(f"Test 9: status={res9.status_code} count={len(data9)} sessions={session_ids}")
except Exception as e:
    log(f"Test 9: ERROR {e}")

# Test 10
try:
    res10 = requests.delete(f"{BASE_URL}/session/verify-session-005")
    data10 = res10.json()
    log(f"Test 10: status={res10.status_code} data={data10}")
except Exception as e:
    log(f"Test 10: ERROR {e}")

# Test 11
try:
    res11 = requests.get(f"{BASE_URL}/history/verify-session-005")
    data11 = res11.json()
    log(f"Test 11: status={res11.status_code} total={data11.get('total_messages')}")
except Exception as e:
    log(f"Test 11: ERROR {e}")

f.close()
print("Done - see test_output.txt")
