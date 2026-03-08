import sys
print("Importing genai...")
import google.generativeai as genai
print("Imported.")
import os
from dotenv import load_dotenv

print("Loading dotenv...")
load_dotenv()
key = os.getenv('GEMINI_API_KEY')
print(f"Key found: {key[:8]}...{key[-4:]}")

print("Configuring...")
genai.configure(api_key=key)

print("Initializing model...")
model = genai.GenerativeModel('gemini-2.0-flash')

print("Calling API...")
try:
    response = model.generate_content('Reply with exactly this JSON and nothing else: {"status": "working", "message": "Gemini API key is valid"}')
    print("Raw response:", response.text)
    print("Token count:", response.usage_metadata.prompt_token_count)
    print("SUCCESS — Gemini API key is valid and working")
except Exception as e:
    print(f"ERROR: {e}")
