from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings

class DocumentProcessor:

    def extract_text(self, file_bytes: bytes) -> str:
        try:
            return file_bytes.decode("utf-8")
        except:
            raise Exception("Unsupported file format")

    def chunk_text(self, text: str):
        chunk_size = settings.CHUNK_SIZE
        overlap = settings.CHUNK_OVERLAP

        splitter = RecursiveCharacterTextSplitter(
            chunk_size,
            overlap
        )
        return splitter.split_text(text)


# 👉 We use chunking in RAG because:

        # Documents are too large for LLM context window
        # So we split into smaller chunks
        # Each chunk is converted into embeddings

#    During query:
        # We search only relevant chunks
        # Instead of sending the whole document

# [Chunking allows us to retrieve only relevant parts of a document instead of processing the entire document, improving performance and accuracy]