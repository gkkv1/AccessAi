import requests
import json
import time
import random

BASE_URL = "http://localhost:8000/api/v1"

def test_forms():
    print("--- TESTING FORMS MODULE ---")
    
    # 1. SETUP: Register & Login (or just Register which likely returns token? No, login does)
    rand_id = random.randint(1000, 9999)
    email = f"formtest{rand_id}@access.ai"
    password = "Password123!"
    
    print(f"\n1. Registering Test User: {email}")
    reg_payload = {
        "email": email,
        "password": password,
        "confirm_password": password,
        "full_name": "Test Form User",
        "disability_type": "visual_impairment" 
    }
    
    try:
        reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
        if reg_res.status_code != 200:
            print(f"❌ Registration Failed: {reg_res.text}")
            return
        print("✅ Registration Successful")
        user_id = reg_res.json()["id"]
        
        # Login to get token
        login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
    except Exception as e:
        print(f"❌ Auth Setup Failed: {e}")
        return

    # 2. TEST AUTO-FILL
    print("\n2. Testing /forms/autofill (AI Integration)")
    
    # Define fields similar to what frontend sends
    fields = [
        {"id": "full_name", "label": "Full Name", "type": "text"},
        {"id": "email", "label": "Email", "type": "email"},
        {"id": "disability_support", "label": "Required Support", "type": "textarea"}
    ]
    
    autofill_payload = {
        "form_id": "test_form_v1",
        "fields": fields
    }
    
    try:
        start = time.time()
        af_res = requests.post(f"{BASE_URL}/forms/autofill", json=autofill_payload, headers=headers)
        duration = time.time() - start
        
        if af_res.status_code == 200:
            data = af_res.json()
            print(f"✅ Auto-Fill Successful ({duration:.2f}s)")
            print(f"   Response: {json.dumps(data, indent=2)}")
            
            # Simple validation
            if "full_name" in data and "email" in data:
                print("   -> Correctly inferred user details!")
            else:
                print("   ⚠️  AI response missing expected keys.")
        else:
            print(f"❌ Auto-Fill Failed: {af_res.status_code}")
            print(af_res.text)
    except Exception as e:
        print(f"❌ Auto-Fill Error: {e}")

    # 3. TEST SUBMISSION
    print("\n3. Testing /forms/submit (DB Persistence)")
    
    submit_payload = {
        "form_id": "test_form_v1",
        "data": {
            "full_name": "Test Form User",
            "email": email,
            "disability_support": "Screen reader optimization",
            "voice_input_field": "Verified voice input functionality"
        }
    }
    
    try:
        sub_res = requests.post(f"{BASE_URL}/forms/submit", json=submit_payload, headers=headers)
        
        if sub_res.status_code == 200:
            data = sub_res.json()
            print(f"✅ Link Submission Successful")
            print(f"   Response: {data}")
            
            if "reference_id" in data:
                print(f"   -> Reference ID generated: {data['reference_id']}")
        else:
            print(f"❌ Submission Failed: {sub_res.status_code}")
            print(sub_res.text)
            
    except Exception as e:
         print(f"❌ Submission Error: {e}")

if __name__ == "__main__":
    test_forms()
