from .base_chunking_strategy import DocumentStrategy

class DefaultStrategy(DocumentStrategy):

    def process(self, file_bytes: bytes) -> list[str]:
        try:
            return [file_bytes.decode("utf-8")]
        except:
            return []