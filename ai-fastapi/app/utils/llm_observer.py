import logging
import json
from opentelemetry import trace
from app.config import settings
from phoenix.otel import register

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
                
        if not hasattr(self, "_phoenix_registered"):
            register(project_name="DOCUMIND_AI")
            self._phoenix_registered = True


        self.tracer = trace.get_tracer("DOCUMIND_AI")
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

        result = self.llm_service.generate_answer(
            question=eval_prompt, context="", chat_history=""
        )
        
        return result["answer"]

    def _default_evaluation(self):
        return {
            "relevance": None,
            "groundedness": None,
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
        if evaluation.get("relevance") is not None:
            span.set_attribute("eval.relevance", evaluation["relevance"])
        
        if evaluation.get("groundedness") is not None:
            span.set_attribute("eval.groundedness", evaluation["groundedness"])
            
        if evaluation.get("hallucination") is not False:
            span.set_attribute("eval.hallucination", evaluation["hallucination"])
            
        span.set_attribute("eval.reason", evaluation["reason"][:500])

    def _should_run_evaluation(self, context, answer):
        return bool(settings.ENABLE_LLM_EVALUATION and context)

    def _should_retry(self, evaluation):
        groundedness = evaluation.get("groundedness")

        return (evaluation.get("hallucination") is True or (groundedness is not None and groundedness < 0.7))
        
    def get_final_answer(self, question, context, chat_history, tracer):
        evaluation = self._default_evaluation()
        retry_used = False

        with tracer.start_as_current_span("llm_pipeline") as span:

            result = self.llm_service.generate_answer(
                question=question,
                context=context,
                chat_history=chat_history
            )
            
            answer = result["answer"]
            usage = result.get("usage", {})
            
            if usage:
                span.set_attribute("llm.prompt_tokens", usage["prompt_tokens"])
                span.set_attribute("llm.completion_tokens", usage["completion_tokens"])
                span.set_attribute("llm.total_tokens", usage["total_tokens"])
            

            span.set_attribute("llm.answer_preview", answer[:300])

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
                span.set_attribute("retry.preview", improved_answer["answer"][:300])

                answer = improved_answer["answer"]

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