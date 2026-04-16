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

    def _default_evaluation(self):
        return {
            "relevance": 0.0,
            "groundedness": 0.0,
            "hallucination": False,
            "reason": "Evaluation not executed"
        }

    def _parse_score(self, value):
        try:
            score = float(value)
        except (TypeError, ValueError):
            return 0.0

        return max(0.0, min(1.0, score))

    def _parse_bool(self, value):
        if isinstance(value, bool):
            return value

        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"true", "yes", "1"}:
                return True
            if normalized in {"false", "no", "0"}:
                return False

        return bool(value)

    def _normalize_evaluation(self, evaluation):
        normalized = self._default_evaluation()
        normalized.update({
            "relevance": self._parse_score(evaluation.get("relevance")),
            "groundedness": self._parse_score(evaluation.get("groundedness")),
            "hallucination": self._parse_bool(evaluation.get("hallucination")),
            "reason": str(evaluation.get("reason") or normalized["reason"]),
        })
        return normalized

    def _set_evaluation_attributes(self, span, evaluation):
        span.set_attribute("eval.relevance", evaluation["relevance"])
        span.set_attribute("eval.groundedness", evaluation["groundedness"])
        span.set_attribute("eval.hallucination", evaluation["hallucination"])
        span.set_attribute("eval.reason", evaluation["reason"][:500])

    def _should_run_evaluation(self, context, answer):
        return bool(settings.ENABLE_LLM_EVALUATION and context and len(answer) > 100)

    def _should_retry(self, evaluation):
        return evaluation.get("hallucination") or evaluation.get("groundedness", 0.0) < 0.5
        
    def get_final_answer(self, question, context, chat_history, tracer):
        evaluation = self._default_evaluation()
        evaluation["relevance"] = 1.0 if context else 0.0
        evaluation["groundedness"] = 1.0
        evaluation["reason"] = "Evaluation skipped"
        retry_used = False

        with tracer.start_as_current_span("llm_pipeline") as span:

            answer = self.llm_service.generate_answer(
                question=question,
                context=context,
                chat_history=chat_history
            )

            span.set_attribute("llm.answer_preview", answer[:300])

            if len(answer) < 50:
                evaluation["reason"] = "Answer too short for evaluation"
                self._set_evaluation_attributes(span, evaluation)
                return {
                    "answer": answer,
                    "evaluation": evaluation,
                    "retry_used": retry_used,
                }

            if self._should_run_evaluation(context, answer):

                with tracer.start_as_current_span("llm_evaluation") as eval_span:
                    eval_result = self.evaluate(question, context, answer)
                    evaluation = self.parse_eval(eval_result)
                    self._set_evaluation_attributes(eval_span, evaluation)

                self._set_evaluation_attributes(span, evaluation)

            else:
                self._set_evaluation_attributes(span, evaluation)

            if self._should_retry(evaluation):

                retry_used = True

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

                answer = improved_answer

        return {
            "answer": answer,
            "evaluation": evaluation,
            "retry_used": retry_used,
        }
    
    
    def parse_eval(self, eval_result):
        try:
            cleaned = eval_result.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.strip("`")
                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:].strip()

            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1:
                cleaned = cleaned[start:end + 1]

            return self._normalize_evaluation(json.loads(cleaned))
        except Exception:
            fallback = self._default_evaluation()
            fallback.update({
                "hallucination": True,
                "reason": "Failed to parse evaluation"
            })
            return fallback