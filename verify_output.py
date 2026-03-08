import io

try:
    with io.open('test_output.txt', 'r', encoding='utf-16le') as f:
        content = f.read()
except UnicodeError:
    with io.open('test_output.txt', 'r', encoding='utf-8') as f:
        content = f.read()

lines = content.splitlines()

all_passed = True
for line in lines:
    if "escalated=False" in line and ("Test 4" in line or "Test 5" in line):
        print(f"FAILED (expected escalated=True): {line}")
        all_passed = False
    elif "intent=general" in line and "Test 1" in line:
        print(f"FAILED (expected intent=order_status): {line}")
        all_passed = False
    elif "intent=general" in line and "Test 2" in line:
        print(f"FAILED (expected intent=return_policy): {line}")
        all_passed = False
    elif "count=0" in line and "Test 9" in line:
        print(f"FAILED (expected count > 0): {line}")
        all_passed = False

if all_passed:
    print("ALL MOCK PARSING ASSERTIONS PASSED!")
    for l in lines:
        print(l)
