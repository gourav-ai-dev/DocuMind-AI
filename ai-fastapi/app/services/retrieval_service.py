import json
from app.services.db_service import DBService
from app.utils.similarity import cosine_similarity


class RetrievalService:

    def __init__(self):
        self.db = DBService()

    def get_relevant_chunks(self, query_embedding, top_k=3):
        conn = self.db.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT Content, Embedding FROM Chunks")
        rows = cursor.fetchall()

        scored_chunks = []

        for row in rows:
            content = row[0]
            embedding = json.loads(row[1])

            score = cosine_similarity(query_embedding, embedding)

            scored_chunks.append((content, score))

        conn.close()

        # Sort by similarity
        scored_chunks.sort(key=lambda x: x[1], reverse=True)

        # Return top K
        return [chunk for chunk, _ in scored_chunks[:top_k]]