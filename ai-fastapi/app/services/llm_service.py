import requests


class LLMService:

    def __init__(self):
        self.url = "http://localhost:11434/api/generate"
        self.model = "tinyllama"

    def generate_answer(self, query, context):
       prompt = f"""
       You are an AI assistant.

       Use BOTH:
       1. Conversation history (for context)
       2. Document context (for factual answers)

       Rules:
       - Prefer document context for answers
       - Use conversation history for understanding follow-ups
       - If answer not in context, say "I don't know"

       {context}

       Question:
       {query}

       Answer:
       """

       response = requests.post(self.url, json={
            "model": self.model,
            "prompt": prompt,
            "stream": False
        })
       
       response.raise_for_status()

       data = response.json()

       return data.get("response", "")