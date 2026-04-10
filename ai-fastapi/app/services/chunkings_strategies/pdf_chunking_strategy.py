from .base_chunking_strategy import DocumentStrategy

class PDFStrategy(DocumentStrategy):

    def process(self, file_bytes: bytes) -> list[str]:
        import pdfplumber
        import io

        chunks = []

        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                # ✅ Remove duplicate lines (headers/footers)
                lines = text.split("\n")
                seen = set()
                cleaned_lines = []

                for line in lines:
                    line = line.strip()
                    if line and line not in seen:
                        seen.add(line)
                        cleaned_lines.append(line)

                clean_text = " ".join(cleaned_lines)

                chunks.append(clean_text)

        return chunks