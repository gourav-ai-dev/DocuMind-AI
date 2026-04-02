import json
from app.services.db_service import DBService
from app.utils.similarity import cosine_similarity


class RetrievalService:

    def __init__(self):
        self.db = DBService()

    def get_relevant_chunks(self, query_embedding, user_id, top_k=3):
        conn = self.db.get_connection()
        cursor = conn.cursor()

        cursor.execute("""SELECT c.Content, c.Embedding FROM Chunks
                        c JOIN Documents d ON c.DocumentId = d.Id
                        WHERE d.UserId = ?""", user_id)
        
        rows = cursor.fetchall()

        scored_chunks = []

        for row in rows:
            content = row[0]
            embedding_raw = row[1]

            try:
                embedding = json.loads(embedding_raw)

                if not isinstance(embedding, list):
                    continue

                if not isinstance(query_embedding, list):
                    raise Exception("Query embedding is not a list")
                
                score = cosine_similarity(query_embedding, embedding)

                scored_chunks.append((content, score))
            
            except Exception as e:
                print("Error Processing Embedding:", e)
                continue

        conn.close()

        scored_chunks.sort(key=lambda x: x[1], reverse=True)

        return [chunk for chunk, _ in scored_chunks[:top_k]]