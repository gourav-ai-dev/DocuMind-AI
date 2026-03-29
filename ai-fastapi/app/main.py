from fastapi import FastAPI, UploadFile, File
from app.services.document_processor import DocumentProcessor

app = FastAPI()

processor = DocumentProcessor()


@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/query")
def query(data: dict):
    user_query = data.get("query", "")
    
    return {
        "answer": f"Echo from AI Layer: {user_query}"
    }

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()

    text = processor.extract_text(content)
    chunks = processor.chunk_text(text)

    return {
        "filename": file.filename,
        "total_chunks": len(chunks),
        "sample_chunk": chunks[0] if chunks else ""
    }