import pyodbc
import json
from datetime import datetime


class DBService:

    def __init__(self):
        self.connection_string = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=(localdb)\MSSQLLocalDB;"
            "DATABASE=DocuMindDB;"
            "Trusted_Connection=yes;"
        )

    def get_connection(self):
        return pyodbc.connect(self.connection_string)

    def save_document(self, filename):
        conn = self.get_connection()
        cursor = conn.cursor()

        doc_id = str(__import__("uuid").uuid4())

        cursor.execute(
            "INSERT INTO Documents (Id, FileName, CreatedAt) VALUES (?, ?, ?)",
            doc_id, filename, datetime.utcnow()
        )

        conn.commit()
        conn.close()

        return doc_id

    def save_chunks(self, document_id, chunks, embeddings):
        conn = self.get_connection()
        cursor = conn.cursor()

        for chunk, embedding in zip(chunks, embeddings):
            chunk_id = str(__import__("uuid").uuid4())

            cursor.execute(
                "INSERT INTO Chunks (Id, DocumentId, Content, Embedding) VALUES (?, ?, ?, ?)",
                chunk_id,
                document_id,
                chunk,
                json.dumps(embedding)  # store as JSON
            )

        conn.commit()
        conn.close()

    def save_chat(self, question, answer):

        conn = self.get_connection()
        cursor = conn.cursor()

        chat_id = str(__import__("uuid").uuid4())

        cursor.execute(
            "INSERT INTO Chathistories (Id, Question, Answer, CreatedAt) VALUES (?, ?, ?, ?)",
            chat_id,
            question,
            answer,
            datetime.utcnow())
        conn.commit()
        conn.close()

    def get_recent_chats(self, limit=3):

        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT TOP {limit} Question, Answer FROM Chathistories ORDER BY CreatedAt DESC")
        
        rows = cursor.fetchall()

        conn.close()

        return [(row[0], row[1]) for row in rows]