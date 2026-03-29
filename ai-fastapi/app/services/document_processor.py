from langchain_text_splitters import RecursiveCharacterTextSplitter


class DocumentProcessor:

    def extract_text(self, file_bytes: bytes) -> str:
        try:
            return file_bytes.decode("utf-8")
        except:
            raise Exception("Unsupported file format")

    def chunk_text(self, text: str):
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        return splitter.split_text(text)