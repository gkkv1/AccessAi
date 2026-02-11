import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_chat_session():
    print("--- TESTING CONVERSATIONAL AGENT ---")

    # 1. Login to get token
    email = "formtest1001@access.ai" # Use an existing user or create one
    password = "Password123!"
    
    print(f"Logging in as {email}...")
    try:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        if login_res.status_code != 200:
            # Try registering if login fails
             print("Login failed, trying registration...")
             reg_payload = {
                "email": email,
                "password": password,
                "confirm_password": password,
                "full_name": "Chat Test User",
                "disability_type": "visual_impairment" 
             }
             requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
             login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login Successful")

    except Exception as e:
        print(f"❌ Auth Failed: {e}")
        return

    # 2. Simulate Chat Request
    # Scenario: User says "I want to allocate John Doe to the Mobile App project"
    # Expected: 
    #   - extracted_updates: { full_name: "John Doe", project_name: "Mobile App" }
    #   - next_question: Something asking for "Role" or "Department" or "Start Date"

    payload = {
        "form_id": "project_allocation",
        "fields": [
            { "id": "full_name", "label": "Full Name", "value": "", "required": True },
            { "id": "project_name", "label": "Project Name", "value": "", "required": True },
            { "id": "role", "label": "Role", "value": "", "required": True },
            { "id": "start_date", "label": "Start Date", "value": "", "required": True }
        ],
        "user_message": "I need to put John Doe on the Mobile App Redesign project.",
        "history": []
    }

    print(f"\nSending Chat Message: '{payload['user_message']}'")
    
    try:
        res = requests.post(f"{BASE_URL}/forms/chat-session", json=payload, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print("\n✅ AI Response Received:")
            print(json.dumps(data, indent=2))
            
            # Simple Assertions
            updates = data.get("extracted_updates", {})
            if "John Doe" in str(updates.values()) or "Mobile" in str(updates.values()):
                 print("✅ Extraction Verification PASSED")
            else:
                 print("❌ Extraction Verification FAILED (Did not catch name/project)")

            if data.get("next_question"):
                 print("✅ Question Generation PASSED")
            else:
                 print("❌ Question Generation FAILED (No question)")

        else:
            print(f"❌ API Error: {res.status_code} - {res.text}")

    except Exception as e:
        print(f"❌ Request Failed: {e}")

if __name__ == "__main__":
    test_chat_session()
