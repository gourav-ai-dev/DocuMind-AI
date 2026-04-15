import phoenix as px
from openinference.instrumentation.langchain import LangChainInstrumentor

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter


class PhoenixMonitor:
    def __init__(self):
        self.session = None

    def start(self):
        # Start Phoenix UI (optional if already running)
        self.session = px.launch_app()
        print(f"🚀 Phoenix UI started at: {self.session.url}")

        tracer_provider = TracerProvider()
        trace.set_tracer_provider(tracer_provider)

        # ✅ IMPORTANT: HTTP endpoint
        endpoint = "http://127.0.0.1:6006/v1/traces"

        span_exporter = OTLPSpanExporter(endpoint=endpoint)
        span_processor = SimpleSpanProcessor(span_exporter)

        tracer_provider.add_span_processor(span_processor)

        # Optional (only if using LangChain later)
        if not LangChainInstrumentor().is_instrumented_by_opentelemetry:
            LangChainInstrumentor().instrument()

        print("🔭 Tracing connected to Phoenix")