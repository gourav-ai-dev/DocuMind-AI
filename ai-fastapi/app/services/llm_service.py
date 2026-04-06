import requests
from app.config import settings

class LLMService:

    def generate_answer(self, query, doc_context, chat_context):

        prompt = f"""
        
        You are a strict AI assistant.
        Rules:
        1. Answer ONLY using DOCUMENT CONTEXT
        2. DO NOT use chat history for facts
        3. If answer is not explicitly in document, say: "I don't know"
        4. DO NOT explain rules
        5. DO NOT repeat instructions

        ---------------------

        DOCUMENT CONTEXT:
        {doc_context}

        ---------------------

        CHAT HISTORY:
        {chat_context}

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