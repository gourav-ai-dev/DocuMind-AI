import pyodbc
import json
import uuid
from datetime import datetime
from app.config import settings

class DBService:

    def get_connection(self):
        return pyodbc.connect(settings.DB_CONNECTION)
    

    def save_document(self, filename, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()

        doc_id = str(uuid.uuid4())

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

        if isinstance(chunks, str):
            chunk_records = [(chunks, embeddings)]
        else:
            chunk_records = list(zip(chunks, embeddings))

        for chunk, embedding in chunk_records:
            cursor.execute(
                "INSERT INTO Chunks (Id, DocumentId, Content, Embedding) VALUES (?, ?, ?, ?)",
                str(uuid.uuid4()),
                document_id,
                chunk,
                json.dumps(embedding)
            )

        conn.commit()
        conn.close()

    def save_chat(self, question, answer, user_id, document_Id):

        conn = self.get_connection()
        cursor = conn.cursor()

        chat_id = str(uuid.uuid4())

        cursor.execute(
            "INSERT INTO Chathistories (Id, UserId, DocumentId, Question, Answer, CreatedAt) VALUES (?, ?, ?, ?, ?, ?)",
            chat_id,
            user_id,
            document_Id,
            question,
            answer,
            datetime.utcnow())
        conn.commit()
        conn.close()

    def get_recent_chats(self, user_id, document_Id, limit=5):

        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            f"""SELECT TOP {limit} Question, Answer FROM Chathistories WHERE UserId = ? and DocumentId = ?  ORDER BY CreatedAt DESC""", user_id, document_Id)
        
        rows = cursor.fetchall()

        conn.close()

        return [(row[0], row[1]) for row in rows]