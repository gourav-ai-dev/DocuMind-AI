from .base_chunking_strategy import DocumentStrategy

class DocxStrategy(DocumentStrategy):

    def process(self, file_bytes: bytes) -> list[str]:
        from docx import Document
        import io

        doc = Document(io.BytesIO(file_bytes))

        chunks = []
        current_section = []

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue

            # simple heuristic: headings are short
            if len(text) < 50:
                if current_section:
                    chunks.append(" ".join(current_section))
                    current_section = []
            current_section.append(text)

        if current_section:
            chunks.append(" ".join(current_section))

        return chunks