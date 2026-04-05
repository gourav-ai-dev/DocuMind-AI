from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings
import chardet
import io
import csv
from docx import Document
import pdfplumber

class DocumentProcessor:

    def extract_text(self, file_bytes: bytes, file_name: str) -> str:
        extension = file_name.split('.')[-1].lower()

        if extension in ["txt", "py", "js", "java", "cpp", "c", "rb"]:
            try:
                return file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                encoding = chardet.detect(file_bytes)["encoding"]
                if not encoding:
                    raise Exception("Cannot detect file encoding")
                return file_bytes.decode(encoding)
            
        elif extension == "csv":
            decoded = file_bytes.decode("utf-8")  # CSV usually text
            reader = csv.reader(decoded.splitlines())
            rows = ["\t".join(row) for row in reader]  # tab separate columns
            return "\n".join(rows)
        
        elif extension == "docx":
            doc = Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs])
        
        elif extension == "pdf":
            text = []
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text.append(page_text)
            return "\n".join(text)
        
        else:
            raise Exception(f"Unsupported file format: {extension}")

    def chunk_text(self, text: str):
        chunk_size = settings.CHUNK_SIZE
        overlap = settings.CHUNK_OVERLAP

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap
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