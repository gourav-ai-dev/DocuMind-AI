import requests
from app.config import settings

class EmbeddingService:

    def __init__(self):
        self.session = requests.Session()
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS

    def generate_embedding(self, text: str):
        response = self.session.post(settings.EMBEDDING_URL, json={
            "model": settings.EMBEDDING_MODEL,
            "prompt": text
        }, timeout=self.timeout)

        response.raise_for_status()

        data = response.json()

        embedding = data.get("embedding")

        if embedding is None:
            raise Exception(f"Embedding API error: {data}")
        
        if not isinstance(embedding, list):
            raise Exception(f"Invalid embedding format: {embedding}")

        return embedding