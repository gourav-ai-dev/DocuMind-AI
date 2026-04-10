from fastapi import FastAPI, UploadFile, File, Form
from app.services.document_processor import DocumentProcessor
from app.services.embedding_service import EmbeddingService
from app.services.db_service import DBService
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService
import logging
from app.services.vector_store_service import VectorStoreService

logging.basicConfig(level=logging.INFO)

app = FastAPI()

processor = DocumentProcessor()
embedding_service = EmbeddingService()
db_service = DBService()
llm_service = LLMService()
vector_store = VectorStoreService()
retrieval_service = RetrievalService(vector_store)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/query")
def query(data: dict):

    user_query = data.get("query", "")
    user_id = data.get("userId")
    document_id = data.get("documentId")

    query_embedding = embedding_service.generate_embedding(user_query)

    relevant_chunks = retrieval_service.get_relevant_chunks(
        query_embedding, user_id=user_id, document_id=document_id
    )
    
    unique_chunks = list(dict.fromkeys([c["content"] for c in relevant_chunks]))
    context = "\n\n".join(unique_chunks[:3])

    recent_chats = db_service.get_recent_chats(user_id=user_id, document_Id=document_id)[-3:]
    
    chat_history = "\n".join([f"User: {q}\nAssistant: {a}" for q, a in recent_chats])

    answer = llm_service.generate_answer(question=user_query,context= context, chat_history=chat_history)

    db_service.save_chat(question=user_query, answer=answer, user_id=user_id, document_Id=document_id)

    return {
        "answer": answer
    }

@app.post("/api/upload")
async def upload(file: UploadFile = File(...), userId: str = Form(...)):
    file_bytes = await file.read()
    file_name = file.filename

    document_id = db_service.save_document(file_name, userId)

    chunks = processor.process_document(file_bytes, file_name)

    for chunk in chunks:
        embedding = embedding_service.generate_embedding(chunk)
        db_service.save_chunks(document_id, chunk, embedding)
        vector_store.add_chunk(embedding=embedding,
                               content=chunk,
                               user_id=userId,
                               document_id=document_id
                               )
        print("Stored in Qdrant:", chunk[:50])

    return {"message": "Document processed successfully"}