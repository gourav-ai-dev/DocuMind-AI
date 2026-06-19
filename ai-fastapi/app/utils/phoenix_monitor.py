import phoenix as px
from openinference.instrumentation.langchain import LangChainInstrumentor


class PhoenixMonitor:
    def __init__(self):
        self.session = None

    def start(self):

        if not LangChainInstrumentor().is_instrumented_by_opentelemetry:
            LangChainInstrumentor().instrument()

        print("🔭 Tracing connected to Phoenix")