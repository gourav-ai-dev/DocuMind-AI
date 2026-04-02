import requests

class EmbeddingService:

    def __init__(self):
        self.url = "http://localhost:11434/api/embeddings"
        self.model = "nomic-embed-text"

    def generate_embedding(self, text: str):
        response = requests.post(self.url, json={
            "model": self.model,
            "prompt": text
        })

        data = response.json()

        embedding = data.get("embedding")

        if embedding is None:
            raise Exception(f"Embedding API error: {data}")
        
        if not isinstance(embedding, list):
            raise Exception(f"Invalid embedding format: {embedding}")

        return embedding