import requests

def test_search():
    url = "http://localhost:8000/api/v1/documents/search"
    query = "test"  # Assuming 'test' matches something, or just any query
    # We need a document to be searched. 
    # If no documents, this returns empty.
    
    try:
        response = requests.post(url, json={"query": "test"})
        if response.status_code == 200:
            results = response.json()
            print(f"Status: {response.status_code}")
            print(f"Results Count: {len(results)}")
            if len(results) > 0:
                print("First Result Keys:", results[0].keys())
                print("First Result Document ID:", results[0].get('document_id'))
            else:
                print("No results found. Upload a document first?")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    test_search()
