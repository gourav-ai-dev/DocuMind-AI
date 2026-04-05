from fastapi import FastAPI, UploadFile, File, Form
from app.services.document_processor import DocumentProcessor
from app.services.embedding_service import EmbeddingService
from app.services.db_service import DBService
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService

retrieval_service = RetrievalService()
app = FastAPI()

processor = DocumentProcessor()
embedding_service = EmbeddingService()
db_service = DBService()
llm_service = LLMService()

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/query")
def query(data: dict):
    user_query = data.get("query", "")
    user_id = data.get("userId")
    
    query_embedding = embedding_service.generate_embedding(user_query)

    relevant_chunks = retrieval_service.get_relevant_chunks(query_embedding, user_id=user_id)

    context = "\n".join(relevant_chunks)

    recent_chats = db_service.get_recent_chats(user_id=user_id)

    conversation_context = ""

    for q, a in reversed(recent_chats):
        conversation_context += f"User: {q}\nAI: {a}\n"

    context = "\n".join(relevant_chunks)
    
    full_context = f"""
    Conversation History:
    {conversation_context}
    
    Document Context:
    {context}
    """

    answer = llm_service.generate_answer(user_query, full_context)

    db_service.save_chat(user_query, answer, user_id)

    return {
        "query": user_query,
        "answer": answer
    }

@app.post("/api/upload")
async def upload(file: UploadFile = File(...), userId: str = Form(...)):
    file_bytes = await file.read()
    file_name = file.filename

    document_id = db_service.save_document(file_name, userId)

    text = processor.extract_text(file_bytes, file_name)
    chunks = processor.chunk_text(text)

    for chunk in chunks:
        embedding = embedding_service.generate_embedding(chunk)
        db_service.save_chunks(document_id, chunk, embedding)

    return {"message": "Document processed successfully"}