import json
from fastapi import FastAPI, UploadFile, File, Form
import logging
import asyncio
from opentelemetry import trace
from opentelemetry.trace import SpanKind
from openinference.semconv.trace import SpanAttributes
from openinference.semconv.trace import OpenInferenceSpanKindValues

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

    with active_tracer.start_as_current_span("POST /api/query", kind=SpanKind.SERVER) as main_span:

        try:
            import uuid
            request_id = str(uuid.uuid4())
            main_span.set_attribute("request.id", request_id)
            main_span.set_attribute("http.method", "POST")
            main_span.set_attribute("http.route", "/api/query")
            main_span.set_attribute("span.kind", "server")

            user_query = data.get("query", "")
            user_id = data.get("userId")
            document_id = data.get("documentId")

            main_span.set_attribute("user.query", user_query)
            if user_id:
                main_span.set_attribute("user.id", user_id)
            if document_id:
                main_span.set_attribute("document.id", document_id)

            with active_tracer.start_as_current_span("rag.embedding") as embedding_span:
                query_embedding = await asyncio.to_thread(
                    embedding_service.generate_embedding,
                    user_query
                )
                embedding_span.set_attribute("embedding.generated", True)
                embedding_span.set_attribute("embedding.vector_size", len(query_embedding))
                embedding_span.set_attribute("embedding.vector_preview", str(query_embedding[:5]))

            with active_tracer.start_as_current_span("rag.retrieval") as retrieval_span:
                relevant_chunks = await asyncio.to_thread(
                    retrieval_service.get_relevant_chunks,
                    query_embedding,
                    user_id,
                    document_id
                )

                unique_chunks = list(dict.fromkeys([c["content"] for c in relevant_chunks]))
                context = "\n\n".join(unique_chunks)

                retrieval_span.set_attribute("rag.chunk_count", len(unique_chunks))
                retrieval_span.set_attribute("retrieval.document_count", len(relevant_chunks))
                retrieval_span.set_attribute("rag.context_preview", context[:2000])


            with active_tracer.start_as_current_span("rag.chat_history") as chat_history_span:
                recent_chats = await asyncio.to_thread(
                    db_service.get_recent_chats,
                    user_id,
                    document_id
                )

                recent_chats = recent_chats[-3:]

                chat_history = "\n".join(
                    [f"User: {q}\nAssistant: {a}" for q, a in recent_chats]
                )
                
                chat_history_span.set_attribute("rag.chat_history_count", len(recent_chats))
                chat_history_span.set_attribute("rag.chat_history_preview", chat_history[:2000])

            with active_tracer.start_as_current_span("rag.llm_call") as span:
                
                span.set_attribute(SpanAttributes.OPENINFERENCE_SPAN_KIND, OpenInferenceSpanKindValues.LLM.value)
                span.set_attribute(SpanAttributes.INPUT_VALUE, user_query)

                llm_result = await asyncio.to_thread(
                    observer.get_final_answer,
                    user_query,
                    context,
                    chat_history,
                    active_tracer
                )
                answer = llm_result["answer"]
                evaluation = llm_result["evaluation"]
                
                span.set_attribute(SpanAttributes.OUTPUT_VALUE, answer)
                span.set_attribute("llm.model_name", "qwen3:14b")
                span.set_attribute("eval.relevance", evaluation["relevance"])
                span.set_attribute("eval.groundedness", evaluation["groundedness"])
                span.set_attribute("eval.hallucination", evaluation["hallucination"])
                span.set_attribute("eval.reason", evaluation["reason"][:2000])
                span.set_attribute("retry.used", llm_result["retry_used"])

            await asyncio.to_thread(
                db_service.save_chat,
                user_query,
                answer,
                user_id,
                document_id
            )

            return {
                "answer": answer,
                "evaluation": evaluation,
                "retryUsed": llm_result["retry_used"],
            }

        except Exception as e:
            main_span.record_exception(e)
            main_span.set_attribute("error", True)
            logging.error(f"Error in query: {str(e)}")
            return {"error": str(e)}


@app.post("/api/upload")
async def upload(file: UploadFile = File(...), userId: str = Form(...)):

    active_tracer = get_tracer()

    with active_tracer.start_as_current_span("POST /api/upload", kind=SpanKind.SERVER) as main_span:

        try:
            file_bytes = await file.read()
            file_name = file.filename

            main_span.set_attribute("http.method", "POST")
            main_span.set_attribute("http.route", "/api/upload")
            main_span.set_attribute("span.kind", "server")
            main_span.set_attribute("file.name", file_name)
            main_span.set_attribute("user.id", userId)

            with active_tracer.start_as_current_span("upload.save_document"):
                document_id = await asyncio.to_thread(
                    db_service.save_document,
                    file_name,
                    userId
                )

            with active_tracer.start_as_current_span("upload.document_processing") as proc_span:
                chunks = processor.process_document(file_bytes, file_name)
                proc_span.set_attribute("chunk.count", len(chunks))

            with active_tracer.start_as_current_span("upload.embedding_and_storage") as span:
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
