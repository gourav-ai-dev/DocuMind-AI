from qdrant_client import QdrantClient
from qdrant_client.models import Filter, PointStruct, FieldCondition, MatchValue, VectorParams, Distance
import uuid
from app.config import settings

class VectorStoreService:

    def __init__(self):
        self.client = QdrantClient(path="qdrant_data")
        self.collection_name = "documents"

        if self.collection_name not in [c.name for c in self.client.get_collections().collections]:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=settings.VECTOR_SIZE, distance= Distance.COSINE)
            )

    def add_chunk(self, embedding, content, user_id, document_id):
        self.add_chunks([embedding], [content], user_id, document_id)

    def add_chunks(self, embeddings, contents, user_id, document_id):
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "content": content,
                        "user_id": user_id,
                        "document_id": document_id
                    }
                )
                for embedding, content in zip(embeddings, contents)
            ]
        )

    def search_chunks(self, query_embedding, user_id, document_id, top_k=3):
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            limit=top_k,
            query_filter= Filter(
                must=[
                    FieldCondition(
                        key="user_id",
                        match=MatchValue(value=user_id)
                    ),
                    FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id)
                    )
                ]
            ))
        return [
            {
                "content": point.payload["content"],
                "score": point.score
            } 
            for point in results.points
        ]
