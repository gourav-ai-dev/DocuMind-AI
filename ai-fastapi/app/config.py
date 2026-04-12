import os

class Settings:

    # 🔥 Database
    DB_CONNECTION = os.getenv(
        "DB_CONNECTION",
        "Driver={ODBC Driver 17 for SQL Server};"
        "Server=(localdb)\MSSQLLocalDB;"
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

    # 🔥 Chunking
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 500))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 50))


# Singleton instance
settings = Settings()