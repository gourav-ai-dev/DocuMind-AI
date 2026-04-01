from fastapi import FastAPI, UploadFile, File
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


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()

    text = processor.extract_text(content)
    chunks = processor.chunk_text(text)

    embeddings = [embedding_service.generate_embedding(chunk) for chunk in chunks]

    doc_id = db_service.save_document(file.filename)
    db_service.save_chunks(doc_id, chunks, embeddings)

    return {
        "document_id": doc_id,
        "total_chunks": len(chunks),
        "message": "Stored in SQL Server"
    }

@app.post("/api/query")
def query(data: dict):
    user_query = data.get("query", "")

    query_embedding = embedding_service.generate_embedding(user_query)

    relevant_chunks = retrieval_service.get_relevant_chunks(query_embedding)

    context = "\n".join(relevant_chunks)

    recent_chats = db_service.get_recent_chats()

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

    db_service.save_chat(user_query, answer)

    return {
        "query": user_query,
        "answer": answer
    }