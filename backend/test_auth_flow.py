import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_auth():
    print("--- TESTING AUTHENTICATION FLOW ---")
    
    # Random email to avoid conflict
    import random
    rand_id = random.randint(1000, 9999)
    email = f"testuser{rand_id}@access.ai"
    password = "SecurePassword123!"
    
    # Generate a unique simulated face token
    simulated_face_token = f"face_token_{int(time.time())}"

    # 1. REGISTER
    print(f"\n1. Registering User: {email}")
    register_payload = {
        "email": email,
        "password": password,
        "confirm_password": password,
        "full_name": "Test User",
        "disability_type": "none",
        "biometric_registered": True,
        "face_id_registered": True,
        "face_id_data": simulated_face_token  # <--- Sending Unique Token
    }
    
    try:
        reg_response = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
        if reg_response.status_code == 200:
            print("✅ Registration Successful")
            user_id = reg_response.json()["id"]
        else:
            print(f"❌ Registration Failed: {reg_response.status_code}")
            print(reg_response.text)
            return
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    # 2. Test Biometric Login (1:N Identification - Unique Token)
    print("\n2. Logging in (Biometric - Identification)...")
    try:
        bio_response = requests.post(f"{BASE_URL}/auth/login/biometric", json={
            # No email, just the unique token
            "face_signature": simulated_face_token 
        })
        if bio_response.status_code == 200:
            print("✅ Biometric Login Successful")
            print(f"User ID from Token: {bio_response.json()['user']['id']}")
            
            # Verify it matches the registered user
            if bio_response.json()['user']['id'] == user_id:
                print("✅ Identity Match Verified")
            else:
                print("❌ Identity Mismatch!")
        else:
            print(f"❌ Biometric Failed: {bio_response.status_code}")
            print(bio_response.text)
            
    except Exception as e:
        print(f"❌ Error during biometric login: {e}")

    # 3. LOGIN (Standard)
    print(f"\n3. Logging in (Email/Password)")
    login_payload = {
        "email": email,
        "password": password
    }
    
    r = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    if r.status_code == 200:
        data = r.json()
        token = data.get("access_token")
        print("✅ Login Successful")
        print(f"Token: {token[:20]}...")
    else:
        print(f"❌ Login Failed: {r.status_code}")
        print(r.text)
        return

    # 3. LOGIN (Biometric Mock)
    print(f"\n3. Logging in (Biometric)")
    bio_payload = {
        "email": email,
        "face_signature": "valid_signature_mock"
    }
    
    r = requests.post(f"{BASE_URL}/auth/login/biometric", json=bio_payload)
    if r.status_code == 200:
        data = r.json()
        print("✅ Biometric Login Successful")
    else:
        print(f"❌ Biometric Login Failed: {r.status_code}")
        print(r.text)

if __name__ == "__main__":
    test_auth()
