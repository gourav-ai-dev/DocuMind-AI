from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.chunkings_strategies.chunking_strategy_factory import StrategyFactory
from app.config import settings


class DocumentProcessor:

    def process_document(self, file_bytes: bytes, file_name: str) -> list[str]:

        strategy = StrategyFactory.get_strategy(file_name)

        base_chunks = strategy.process(file_bytes)

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )

        final_chunks = []

        for chunk in base_chunks:
            split_chunks = splitter.split_text(chunk)
            final_chunks.extend(split_chunks)

        final_chunks = list(dict.fromkeys(final_chunks))

        return final_chunks


# 👉 We use chunking in RAG because:

        # Documents are too large for LLM context window
        # So we split into smaller chunks
        # Each chunk is converted into embeddings

#    During query:
        # We search only relevant chunks
        # Instead of sending the whole document

# [Chunking allows us to retrieve only relevant parts of a document instead of processing the entire document, improving performance and accuracy]