import requests
from app.config import settings

class LLMService:
   
   def generate_answer(self, question: str, context: str, chat_history: str):

    prompt = f"""
### ROLE
You are a precise Assistant. Your task is to answer the Question based strictly on the provided Context.

### OPERATIONAL RULES
1. **Source Grounding:** Answer ONLY using the provided Context. If the answer is not there, say "I don't know."
2. **Contextual awareness:** Use Chat History solely to resolve pronouns (e.g., "it", "they", "that") in the latest question.
3. **Style:** Be direct, professional, and concise. 
4. **No Meta-Talk:** Do not mention the context, the rules, or phrases like "Based on the information provided."

### DATA
CHAT HISTORY:
{chat_history}

CONTEXT:
{context}

QUESTION:
{question}

### RESPONSE:
"""
    
#     prompt = f"""
#     You are a precise AI assistant.

#     RULES:
#     - Answer ONLY from the provided context
#     - Do NOT include labels like "Context:", etc.
#     - Do NOT mention chat history or context
#     - If not found, reply exactly: I don't know

#     CONTEXT:
#     {context}

#     CHAT HISTORY:
#     {chat_history}

#     QUESTION:
#     {question}
    
# """

    response = requests.post(settings.LLM_URL, json={
        "model": settings.LLM_MODEL,
        "prompt": prompt,
        "stream": False
    })

    response.raise_for_status()
    data = response.json()
    print(f"response from llm - {data.get("response", "")}")
    return data.get("response", "")