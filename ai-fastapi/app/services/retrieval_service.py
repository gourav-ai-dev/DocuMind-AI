class RetrievalService:

    def __init__(self, vector_store):
        self.vector_store = vector_store

    def get_relevant_chunks(self, query_embedding, user_id, document_id, top_k=3):
        return self.vector_store.search_chunks(
            query_embedding=query_embedding,
            user_id=user_id,
            document_id=document_id,
            top_k=top_k
        )