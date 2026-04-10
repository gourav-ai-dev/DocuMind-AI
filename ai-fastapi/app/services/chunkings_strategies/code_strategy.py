from .base_chunking_strategy import DocumentStrategy

class CodeStrategy(DocumentStrategy):

    def process(self, file_bytes: bytes) -> list[str]:
        text = file_bytes.decode("utf-8")

        # split by functions/classes
        import re

        blocks = re.split(r'\n(def |class )', text)

        chunks = []
        for block in blocks:
            if block.strip():
                chunks.append(block.strip())

        return chunks