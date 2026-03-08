import sys
import os
import asyncio
from dotenv import load_dotenv

print("--- DEBUG START ---")
load_dotenv()
key = os.getenv('GEMINI_API_KEY')
if not key:
    print("ERROR: GEMINI_API_KEY not found in .env")
    sys.exit(1)
print(f"Key identified: {key[:8]}...{key[-4:]}")

try:
    import google.generativeai as genai
    print("google.generativeai imported successfully")
except ImportError:
    print("ERROR: google.generativeai not installed")
    sys.exit(1)

genai.configure(api_key=key)

async def test_call():
    print("Initializing model...")
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("Model initialized.")
    
    print("Sending content generation request...")
    try:
        # Using the async version to match ai_service.py's implementation
        response = await model.generate_content_async(
            'Reply with exactly this JSON and nothing else: {"status": "working", "message": "Gemini API key is valid"}'
        )
        print("API Response received.")
        print("Raw text:", response.text)
        print("Prompt tokens:", response.usage_metadata.prompt_token_count)
        print("Response tokens:", response.usage_metadata.candidates_token_count)
        print("--- SUCCESS ---")
    except Exception as e:
        print(f"API ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_call())
