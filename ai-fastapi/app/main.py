from fastapi import FastAPI, UploadFile, File, Form
import logging
import asyncio
from opentelemetry import trace

from app.services.document_processor import DocumentProcessor
from app.services.embedding_service import EmbeddingService
from app.services.db_service import DBService
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService
from app.services.vector_store_service import VectorStoreService

from app.utils.llm_observer import LLMObserver

logging.basicConfig(level=logging.INFO)

app = FastAPI()

processor = DocumentProcessor()
embedding_service = EmbeddingService()
db_service = DBService()
llm_service = LLMService()
vector_store = VectorStoreService()
retrieval_service = RetrievalService(vector_store)

observer = LLMObserver(llm_service)
tracer = None


@app.on_event("startup")
def startup_event():
    global tracer
    observer.start()
    tracer = observer.get_tracer()
    logging.info("LLM observer initialized")


def get_tracer():
    return tracer or trace.get_tracer(__name__)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/query")
async def query(data: dict):

    active_tracer = get_tracer()

    with active_tracer.start_as_current_span("rag_pipeline") as main_span:

        try:
            import uuid
            request_id = str(uuid.uuid4())
            main_span.set_attribute("request.id", request_id)

            user_query = data.get("query", "")
            user_id = data.get("userId")
            document_id = data.get("documentId")

            main_span.set_attribute("user.query", user_query)

            with active_tracer.start_as_current_span("embedding"):
                query_embedding = await asyncio.to_thread(
                    embedding_service.generate_embedding,
                    user_query
                )

            with active_tracer.start_as_current_span("retrieval") as retrieval_span:
                relevant_chunks = await asyncio.to_thread(
                    retrieval_service.get_relevant_chunks,
                    query_embedding,
                    user_id,
                    document_id
                )

                unique_chunks = list(dict.fromkeys([c["content"] for c in relevant_chunks]))
                context = "\n\n".join(unique_chunks[:3])

                retrieval_span.set_attribute("rag.chunk_count", len(unique_chunks))
                retrieval_span.set_attribute("rag.context_preview", context[:500])

            with active_tracer.start_as_current_span("chat_history"):
                recent_chats = await asyncio.to_thread(
                    db_service.get_recent_chats,
                    user_id,
                    document_id
                )

                recent_chats = recent_chats[-3:]

                chat_history = "\n".join(
                    [f"User: {q}\nAssistant: {a}" for q, a in recent_chats]
                )

            with active_tracer.start_as_current_span("llm_call") as span:
                
                span.set_attribute("openinference.span.kind", "LLM")
                span.set_attribute("input.value", user_query[:1000])
                span.set_attribute("rag.context_length", len(context))

                answer = await asyncio.to_thread(
                    observer.get_final_answer,
                    user_query,
                    context,
                    chat_history,
                    active_tracer
                )
                
                span.set_attribute("output.value", answer[:1000])
                span.set_attribute("llm.model_name", "qwen3:14b")

            await asyncio.to_thread(
                db_service.save_chat,
                user_query,
                answer,
                user_id,
                document_id
            )

            return {"answer": answer}

        except Exception as e:
            main_span.record_exception(e)
            main_span.set_attribute("error", True)
            logging.error(f"Error in query: {str(e)}")
            return {"error": str(e)}


@app.post("/api/upload")
async def upload(file: UploadFile = File(...), userId: str = Form(...)):

    active_tracer = get_tracer()

    with active_tracer.start_as_current_span("document_upload") as main_span:

        try:
            file_bytes = await file.read()
            file_name = file.filename

            main_span.set_attribute("file.name", file_name)
            main_span.set_attribute("user.id", userId)

            with active_tracer.start_as_current_span("save_document"):
                document_id = await asyncio.to_thread(
                    db_service.save_document,
                    file_name,
                    userId
                )

            with active_tracer.start_as_current_span("document_processing") as proc_span:
                chunks = processor.process_document(file_bytes, file_name)
                proc_span.set_attribute("chunk.count", len(chunks))

            with active_tracer.start_as_current_span("embedding_and_storage") as span:
                embeddings = []

                for chunk in chunks:
                    embeddings.append(await asyncio.to_thread(
                        embedding_service.generate_embedding,
                        chunk
                    ))

                await asyncio.to_thread(
                    db_service.save_chunks,
                    document_id,
                    chunks,
                    embeddings
                )

                await asyncio.to_thread(
                    vector_store.add_chunks,
                    embeddings,
                    chunks,
                    userId,
                    document_id
                )

                span.set_attribute("total_chunks", len(chunks))

            return {"message": "Document processed successfully"}

        except Exception as e:
            main_span.record_exception(e)
            main_span.set_attribute("error", True)
            logging.error(f"Upload error: {str(e)}")
            return {"error": str(e)}
