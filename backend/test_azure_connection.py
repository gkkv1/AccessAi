"""
Quick diagnostic script to test Azure OpenAI connectivity
"""
from app.core.config import settings
from openai import AzureOpenAI
import sys

print("=== Azure OpenAI Connectivity Test ===\n")

# Check config
print(f"✓ Provider: {settings.MODEL_PROVIDER}")
print(f"✓ Endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
print(f"✓ GPT Deployment: {settings.AZURE_OPENAI_DEPLOYMENT}")
print(f"✓ Whisper Deployment: {settings.AZURE_WHISPER_DEPLOYMENT}")
print(f"✓ API Key: {'Present' if settings.AZURE_OPENAI_API_KEY else 'Missing'}\n")

# Test GPT deployment
print("Testing GPT deployment...")
try:
    client = AzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_version=settings.AZURE_OPENAI_API_VERSION
    )
    
    response = client.chat.completions.create(
        model=settings.AZURE_OPENAI_DEPLOYMENT,
        messages=[{"role": "user", "content": "Say 'test successful'"}],
        max_tokens=10
    )
    
    print(f"✅ GPT deployment '{settings.AZURE_OPENAI_DEPLOYMENT}' is working!")
    print(f"   Response: {response.choices[0].message.content}\n")
except Exception as e:
    print(f"❌ GPT deployment failed: {str(e)}\n")
    sys.exit(1)

# Test Whisper deployment
print("Testing Whisper deployment...")
print("⚠️  Skipping - requires actual audio file")
print(f"   Deployment name: {settings.AZURE_WHISPER_DEPLOYMENT}")
print("   To test: Upload an audio file through the frontend\n")

print("=== Diagnostic Complete ===")
print("\nIf GPT test passed, your Azure OpenAI is working correctly.")
print("If processing hangs in your app, the issue might be:")
print("1. Whisper deployment doesn't exist (if transcribing video)")
print("2. Network/firewall blocking Azure API calls")  
print("3. API rate limits or quota exceeded")
