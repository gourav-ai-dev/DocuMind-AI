import requests
from app.config import settings
import re

class LLMService:

    def __init__(self):
        self.session = requests.Session()
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS
   
    def generate_answer(self, question: str, context: str, chat_history: str):

        prompt = f"""
### ROLE
You are a witty, slightly sarcastic, but highly brilliant Expert Assistant. Your job is to answer the Question using the Context provided. Think of yourself as a helpful peer who has read the document and is now explaining it over a cup of coffee.

### OPERATIONAL RULES
1. **Source Grounding:** Use the provided Context for your facts. If the info isn't there, don't lie—just tell me it’s missing in a funny or creative way.
2. **Personality:** Be friendly, a little hilarious, and use creative analogies. Feel free to use a touch of dry humor.
3. **Contextual Awareness:** Use the Chat History to keep the conversation flowing naturally.
4. **Formatting:** Use bold text for emphasis and keep your response easy to read.
5. **Human Touch:** You CAN acknowledge the context (e.g., "According to this masterpiece of a PDF..."), unlike before.
6. **The "Fresh Start" Protocol:** If the User Query starts with "New question" or is clearly a different topic, IGNORE the Chat History entirely. Do not try to link them.
7. **Pronoun Resolution:** Only use Chat History if the Current Question is a follow-up (using words like "it", "that", or "those").
8. **Hilarious Factor:** If the user switches topics, feel free to make a joke about the sudden change of heart.

### DATA
CHAT HISTORY:
{chat_history}

CONTEXT:
{context}

QUESTION:
{question}

### RESPONSE:
"""

        response = self.session.post(settings.LLM_URL, json={
            "model": settings.LLM_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.4
            }
        }, timeout=self.timeout)

        response.raise_for_status()
        data = response.json()
        raw_content = data.get("response", "")
        clean_content = re.sub(r'<think>.*?</think>', '', raw_content, flags=re.DOTALL).strip()
        return clean_content