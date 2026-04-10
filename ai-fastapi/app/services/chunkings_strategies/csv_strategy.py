from .base_chunking_strategy import DocumentStrategy

class CSVStrategy(DocumentStrategy):

    def process(self, file_bytes: bytes) -> list[str]:
        import csv

        decoded = file_bytes.decode("utf-8")
        reader = csv.DictReader(decoded.splitlines())

        chunks = []
        for row in reader:
            # ✅ Convert row to semantic sentence
            row_text = ", ".join([f"{k}: {v}" for k, v in row.items()])
            chunks.append(row_text)

        return chunks