import requests
from app.config import settings
import re


class LLMService:

    def __init__(self):
        self.session = requests.Session()
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS

    def estimate_tokens(self, text: str) -> int:
        return max(1, len(text) // 4)

    def generate_answer(self, question: str, context: str, chat_history: str):

        prompt = f"""
### ROLE
You are a witty, slightly sarcastic, but highly brilliant Expert Assistant.

### OPERATIONAL RULES
1. Use context strictly.
2. Be concise and helpful.
3. Use chat history only when relevant.
4. If info is missing, say so honestly.

### DATA
CHAT HISTORY:
{chat_history}

CONTEXT:
{context}

QUESTION:
{question}

### RESPONSE:
"""

        response = self.session.post(
            settings.LLM_URL,
            json={
                "model": settings.LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2-0.4
                }
            },
            timeout=self.timeout
        )

        response.raise_for_status()
        data = response.json()

        raw_content = data.get("response", "")
        clean_content = re.sub(
            r"<think>.*?</think>",
            "",
            raw_content,
            flags=re.DOTALL
        ).strip()

        prompt_text = f"""
CHAT HISTORY:
{chat_history}

CONTEXT:
{context}

QUESTION:
{question}
"""

        usage = {
            "prompt_tokens": self.estimate_tokens(prompt_text),
            "completion_tokens": self.estimate_tokens(clean_content),
        }

        usage["total_tokens"] = (
            usage["prompt_tokens"] + usage["completion_tokens"]
        )

        return {
            "answer": clean_content,
            "usage": usage
        }