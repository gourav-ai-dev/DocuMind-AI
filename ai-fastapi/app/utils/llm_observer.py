import logging
import json
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from app.config import settings


class LLMObserver:
    def __init__(self, llm_service):
        self.llm_service = llm_service
        self.tracer = None
        self.session = None

    def start(self):
        if not settings.ENABLE_OBSERVABILITY:
            self.tracer = trace.get_tracer(__name__)
            return

        if settings.ENABLE_PHOENIX_UI:
            try:
                import phoenix as px

                self.session = px.launch_app()
                logging.info("Phoenix running at: %s", self.session.url)
            except Exception as exc:
                logging.warning("Phoenix UI failed to start: %s", exc)

        tracer_provider = TracerProvider()
        trace.set_tracer_provider(tracer_provider)

        exporter = OTLPSpanExporter(endpoint=settings.OTLP_TRACES_ENDPOINT)

        tracer_provider.add_span_processor(BatchSpanProcessor(exporter))

        self.tracer = trace.get_tracer(__name__)
        logging.info("LLM observer ready")

    def get_tracer(self):
        return self.tracer

    def evaluate(self, question, context, answer):
        """
        Run LLM-based evaluation
        """

        eval_prompt = f"""
You are an evaluator.

Question:
{question}

Context:
{context}

Answer:
{answer}

Evaluate strictly based on the context.

Return JSON:
{{
    "relevance": 0-1,
    "groundedness": 0-1,
    "hallucination": true/false,
    "reason": "short explanation"
}}
"""

        return self.llm_service.generate_answer(
            question=eval_prompt, context="", chat_history=""
        )
        
    def get_final_answer(self, question, context, chat_history, tracer):
        parsed_eval = {
            "groundedness": 1,
            "hallucination": False,
        }

        with tracer.start_as_current_span("llm_pipeline") as span:

            answer = self.llm_service.generate_answer(
                question=question,
                context=context,
                chat_history=chat_history
            )

            span.set_attribute("llm.answer_preview", answer[:300])

            if len(answer) < 50:
                return answer

            if settings.ENABLE_LLM_EVALUATION and context and len(answer) > 100:

                eval_result = self.evaluate(question, context, answer)
                parsed_eval = self.parse_eval(eval_result)

                span.set_attribute("eval.result", str(parsed_eval))

            if parsed_eval.get("hallucination") or parsed_eval.get("groundedness", 0) < 0.5:

                retry_prompt = f"""Answer ONLY using the provided context.
        Do NOT add extra information.

        Context:
        {context}

        Question:
        {question}
        """

                improved_answer = self.llm_service.generate_answer(
                    question=retry_prompt,
                    context="",
                    chat_history=""
                )

                span.set_attribute("retry.used", True)
                span.set_attribute("retry.preview", improved_answer[:300])

                return improved_answer

        return answer
    
    
    def parse_eval(self, eval_result):
        try:
            return json.loads(eval_result)
        except Exception:
            return {
                "relevance": 0,
                "groundedness": 0,
                "hallucination": True,
                "reason": "Failed to parse evaluation"
            }