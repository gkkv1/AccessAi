import requests
import json
import time
import os

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "rag_tester@access.ai"
PASSWORD = "Password123!"

def setup_user():
    print("--- 1. Setting up User ---")
    # Register/Login
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if r.status_code == 200:
        return r.json()["access_token"]
    
    # Register if login fails
    print("User not found, registering...")
    reg = requests.post(f"{BASE_URL}/auth/register", json={
        "email": EMAIL,
        "password": PASSWORD,
        "confirm_password": PASSWORD,
        "full_name": "RAG Tester",
        "disability_type": "none",
        "biometric_registered": False,
        "face_id_registered": False
    })
    if reg.status_code == 200:
        return requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD}).json()["access_token"]
    else:
        print(f"Registration failed: {reg.text}")
        return None

def test_rag_flow():
    token = setup_user()
    if not token:
        print("❌ Auth Failed")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Dummy Document
    print("\n--- 2. Creating Dummy Text File ---")
    file_content = """
    ACCESS.AI ACCESSIBILITY POLICY
    
    1. Purpose
    The goal of ACCESS.AI is to ensure that all employees, regardless of disability, can access workplace documents.
    
    2. Technologies
    We use advanced RAG (Retrieval Augmented Generation) to semantically understand documents.
    We use WebAuthn for secure, passwordless authentication.
    
    3. Compliance
    All features must adhere to WCAG 2.1 AA standards. Color contrast ratios must be at least 4.5:1.
    """
    
    with open("test_policy.txt", "w") as f:
        f.write(file_content)
        
    # 3. Upload Document
    print("\n--- 3. Uploading Document ---")
    files = {'file': ('test_policy.txt', open('test_policy.txt', 'rb'), 'text/plain')}
    
    try:
        r = requests.post(f"{BASE_URL}/documents/", headers=headers, files=files)
        if r.status_code == 200:
            doc_data = r.json()
            print(f"✅ Upload Successful. Doc ID: {doc_data['id']}")
            print(f"Status: {doc_data.get('status')} (Should be 'ready' if sync)")
        else:
            print(f"❌ Upload Failed: {r.status_code} - {r.text}")
            return
    except Exception as e:
        print(f"❌ Upload Error: {e}")
        return

    # 4. Search
    print("\n--- 4. Testing RAG Search ---")
    query = "What standards must features adhere to?"
    print(f"Query: '{query}'")
    
    try:
        r = requests.post(f"{BASE_URL}/documents/search", headers=headers, json={"query": query})
        if r.status_code == 200:
            results = r.json()
            print(f"✅ Search Returned {len(results)} results")
            for i, res in enumerate(results):
                print(f"[{i+1}] {res['title']} (Score: {res['relevance']})")
                print(f"    Snippet: {res['snippet'][:100]}...")
                
            # Verify Content
            if any("WCAG 2.1" in res['snippet'] for res in results):
                print("✅ Found relevant answer!")
            else:
                print("⚠️ Warning: Did not find expected keywords in results.")
        else:
            print(f"❌ Search Failed: {r.status_code} - {r.text}")
            
    except Exception as e:
        print(f"❌ Search Error: {e}")

if __name__ == "__main__":
    test_rag_flow()
