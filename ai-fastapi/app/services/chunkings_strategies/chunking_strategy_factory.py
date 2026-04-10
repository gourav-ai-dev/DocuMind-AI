from .default_strategy import DefaultStrategy
from .pdf_chunking_strategy import PDFStrategy
from .csv_strategy import CSVStrategy
from .code_strategy import CodeStrategy
from .docx_strategy import DocxStrategy
from .xlsx_strategy import XLSXStrategy

class StrategyFactory:

    @staticmethod
    def get_strategy(file_name: str):
        ext = file_name.split('.')[-1].lower()

        if ext == "pdf":
            return PDFStrategy()

        elif ext == "csv":
            return CSVStrategy()

        elif ext == "docx":
            return DocxStrategy()

        elif ext in ["py", "js", "java", "cpp", "c", "rb"]:
            return CodeStrategy()
        
        elif ext in ["xlsx", "xls"]:
            return XLSXStrategy()

        else:
            return DefaultStrategy()