import openpyxl
import io
from .base_chunking_strategy import DocumentStrategy

class XLSXStrategy(DocumentStrategy):

    def process(self, file_bytes: bytes) -> list[str]:
        workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)

        chunks = []

        for sheet in workbook.worksheets:
            rows = list(sheet.iter_rows(values_only=True))

            if not rows:
                continue

            headers = rows[0]

            for row in rows[1:]:
                row_data = []

                for col_name, value in zip(headers, row):
                    if col_name and value is not None:
                        row_data.append(f"{col_name}: {value}")

                if row_data:
                    chunks.append(", ".join(row_data))

        return chunks