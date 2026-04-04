import pyodbc
import json
from datetime import datetime
from app.config import settings

class DBService:

    def get_connection(self):
        return pyodbc.connect(settings.DB_CONNECTION)

    def save_document(self, filename, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()

        doc_id = str(__import__("uuid").uuid4())

        cursor.execute(
            "INSERT INTO Documents (Id, FileName, CreatedAt, UserId) VALUES (?, ?, ?, ?)",
            doc_id, filename, datetime.utcnow(), user_id
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

    def save_chat(self, question, answer, user_id):

        conn = self.get_connection()
        cursor = conn.cursor()

        chat_id = str(__import__("uuid").uuid4())

        cursor.execute(
            "INSERT INTO Chathistories (Id, UserId, Question, Answer, CreatedAt) VALUES (?, ?, ?, ?, ?)",
            chat_id,
            user_id,
            question,
            answer,
            datetime.utcnow())
        conn.commit()
        conn.close()

    def get_recent_chats(self, user_id, limit=3):

        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            f"""SELECT TOP {limit} Question, Answer FROM Chathistories WHERE UserId = ? ORDER BY CreatedAt DESC""", user_id)
        
        rows = cursor.fetchall()

        conn.close()

        return [(row[0], row[1]) for row in rows]