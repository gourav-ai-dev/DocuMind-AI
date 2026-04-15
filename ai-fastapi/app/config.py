import os

class Settings:

    # 🔥 Database
    DB_CONNECTION = os.getenv(
        "DB_CONNECTION",
        "Driver={ODBC Driver 17 for SQL Server};"
        r"Server=(localdb)\MSSQLLocalDB;"
        "Database=DocuMindDB;"
        "Trusted_Connection=yes;"
    )

    # 🔥 Embedding
    EMBEDDING_URL = os.getenv(
        "EMBEDDING_URL",
        "http://localhost:11434/api/embeddings"
    )

    EMBEDDING_MODEL = os.getenv(
        "EMBEDDING_MODEL",
        "mxbai-embed-large"
    )
    
    VECTOR_SIZE = int(os.getenv("VECTOR_SIZE", 1024))

    # 🔥 LLM
    LLM_URL = os.getenv(
        "LLM_URL",
        "http://localhost:11434/api/generate"
    )

    LLM_MODEL = os.getenv(
        "LLM_MODEL",
        "qwen3:14b"
    )

    REQUEST_TIMEOUT_SECONDS = float(
        os.getenv("REQUEST_TIMEOUT_SECONDS", "120")
    )

    ENABLE_OBSERVABILITY = os.getenv(
        "ENABLE_OBSERVABILITY",
        "false"
    ).lower() == "true"

    ENABLE_PHOENIX_UI = os.getenv(
        "ENABLE_PHOENIX_UI",
        "false"
    ).lower() == "true"

    ENABLE_LLM_EVALUATION = os.getenv(
        "ENABLE_LLM_EVALUATION",
        "false"
    ).lower() == "true"

    OTLP_TRACES_ENDPOINT = os.getenv(
        "OTLP_TRACES_ENDPOINT",
        "http://127.0.0.1:6006/v1/traces"
    )

    # 🔥 Chunking
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 500))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 50))


# Singleton instance
settings = Settings()