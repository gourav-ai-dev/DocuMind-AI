import requests
from app.config import settings

class EmbeddingService:

    def generate_embedding(self, text: str):
        response = requests.post(settings.EMBEDDING_URL, json={
            "model": settings.EMBEDDING_MODEL,
            "prompt": text
        })

        data = response.json()

        embedding = data.get("embedding")

        if embedding is None:
            raise Exception(f"Embedding API error: {data}")
        
        if not isinstance(embedding, list):
            raise Exception(f"Invalid embedding format: {embedding}")

        return embedding