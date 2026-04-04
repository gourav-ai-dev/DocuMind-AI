import requests
from app.config import settings

class LLMService:

    def generate_answer(self, query, context):
       

       prompt = f"""
       You are an AI assistant.

       You MUST follow these rules:
       - Use DOCUMENT CONTEXT for factual answers
       - Use CHAT HISTORY only for understanding follow-up questions
       - If answer is not in document context, say: "I don't know"
       - Do NOT make up answers

       ---------------------
       DOCUMENT CONTEXT:
       {context}

       ---------------------
       QUESTION:
       {query}

       ---------------------
       ANSWER:
       """

       response = requests.post(settings.LLM_URL, json={
            "model": settings.LLM_MODEL,
            "prompt": prompt,
            "stream": False
        })
       
       response.raise_for_status()

       data = response.json()

       return data.get("response", "")