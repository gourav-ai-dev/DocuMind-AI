# DocuMind AI — Data Flow (Detailed)

## 🧠 Overview

This document describes how data flows through the system during:

1. Document Upload & Processing
2. User Query & Response Generation

The system uses a Retrieval-Augmented Generation (RAG) pipeline to ensure accurate and context-aware responses.

---

## 📄 1️⃣ Document Upload & Processing Flow

### 🔄 Flow Diagram

```
User Upload
     ↓
React UI
     ↓
.NET API
     ↓
FastAPI AI Layer
     ↓
SQL Server
```

---

### 🔍 Step-by-Step Processing

1. **User Uploads Document**

   * Supported formats: PDF, TXT, CSV, code files

2. **React UI**

   * Sends file to .NET API

3. **.NET API**

   * Validates file (type, size)
   * Forwards file to FastAPI AI Layer

4. **FastAPI AI Layer**

   * Extracts text from document
   * Splits text into chunks
   * Generates embeddings for each chunk

5. **SQL Server**

   * Stores:

     * Document metadata
     * Text chunks
     * Embeddings (vector format)

---

### ⚙️ Key Design Points

* Chunk size and overlap are configurable
* Embeddings are precomputed (improves performance)
* Supports multiple file types via extensible parsers

---

## 💬 2️⃣ Query / Chat Flow

### 🔄 Flow Diagram

```
User Query
     ↓
React UI
     ↓
.NET API
     ↓
FastAPI AI Layer
     ↓
SQL Server (retrieve)
     ↓
LLM
     ↓
.NET API
     ↓
React UI
```

---

### 🔍 Step-by-Step Processing

1. **User Sends Query**

   * Input entered in chat UI

2. **React UI**

   * Sends query to .NET API
   * Shows loading/typing indicator

3. **.NET API**

   * Validates request
   * Sends query to FastAPI AI Layer

4. **FastAPI AI Layer**

   * Converts query into embedding
   * Retrieves top relevant chunks from SQL Server
   * Builds prompt with context + query
   * Sends prompt to LLM

5. **LLM (Ollama / Configurable)**

   * Generates answer using provided context

6. **.NET API**

   * Receives response
   * Stores chat history in SQL Server

7. **React UI**

   * Displays answer
   * Updates chat history

---

### ⚙️ Key Design Points

* Top-K retrieval (3–5 chunks) for performance
* Context injection improves answer accuracy
* Chat history stored for auditing and UX

---

## ⚡ Performance Considerations

* Precomputed embeddings reduce runtime latency
* Lightweight LLM improves response speed
* Configurable retrieval size (Top-K)
* Async communication between services

---

## 🧩 Future Enhancements

* Re-ranking for better retrieval accuracy
* Hybrid search (vector + keyword)
* Response caching for repeated queries
* Streaming responses for better UX

---

## 🧠 Summary

This data flow ensures:

* Fast document processing
* Accurate context retrieval
* Efficient LLM usage
* Scalable and maintainable design

DocuMind AI combines structured data flow with AI intelligence to deliver a high-performance chatbot experience.
