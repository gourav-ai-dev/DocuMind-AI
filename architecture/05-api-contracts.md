# DocuMind AI — API Contracts

## Overview

This document defines the API contracts between the .NET Backend and the FastAPI AI Layer.

These APIs handle:

* Document upload and processing
* Query handling and response generation

---

## Base URL

```
http://localhost:8000/api
```

---

## 1️⃣ Upload Document API

### 🔹 Endpoint

```
POST /upload
```

---

### 🔹 Description

Uploads a document to the AI layer for processing (chunking + embedding).

---

### 🔹 Request (Multipart Form)

| Field      | Type   | Description                    |
| ---------- | ------ | ------------------------------ |
| file       | File   | Document (PDF, TXT, CSV, etc.) |
| documentId | string | Unique document identifier     |

---

### 🔹 Response

```json
{
  "status": "success",
  "message": "Document processed successfully",
  "chunks": 120
}
```

---

### 🔹 Notes

* File is processed immediately after upload
* Embeddings are generated and stored in SQL Server

---

## 2️⃣ Query API

### 🔹 Endpoint

```
POST /query
```

---

### 🔹 Description

Processes user query using RAG and returns an answer.

---

### 🔹 Request

```json
{
  "query": "What is this document about?",
  "sessionId": "abc123",
  "topK": 5
}
```

---

### 🔹 Response

```json
{
  "answer": "This document explains...",
  "sources": [
    "chunk1 text...",
    "chunk2 text..."
  ]
}
```

---

### 🔹 Notes

* Query is converted into embedding
* Relevant chunks are retrieved from SQL Server
* LLM generates response using context

---

## 3️⃣ Health Check API

### 🔹 Endpoint

```
GET /health
```

---

### 🔹 Response

```json
{
  "status": "ok"
}
```

---

## 4️⃣ Config API (Future Phase)

### 🔹 Endpoint

```
GET /config
POST /config
```

---

### 🔹 Description

Retrieve or update system configuration dynamically.

---

### 🔹 Example Config

```json
{
  "llm_provider": "ollama",
  "model": "phi3",
  "chunk_size": 500,
  "top_k": 5
}
```

---

## 🔐 Error Handling

### 🔹 Standard Error Response

```json
{
  "status": "error",
  "message": "Invalid file format"
}
```

---

## 🔁 Flow Summary

### Upload Flow

.NET → FastAPI `/upload` → SQL Server

### Query Flow

.NET → FastAPI `/query` → SQL Server → LLM → Response

---

## Design Principles

* Simple REST APIs
* JSON-based communication
* Stateless requests
* Configurable parameters (topK, model)

---

## Summary

These API contracts define a clear and scalable communication layer between .NET and the AI system, enabling modular development and easy future enhancements.
