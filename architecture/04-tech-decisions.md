# DocuMind AI — Technical Decisions

## Overview

This document outlines the key technology choices made in DocuMind AI and the reasoning behind each decision. The goal is to ensure scalability, performance, flexibility, and maintainability.

---

## Frontend — React

### Why React?

* Component-based architecture for reusable UI
* Rich ecosystem (UI libraries, state management)
* Faster development for modern interfaces
* Strong community support

### Trade-offs

* Requires additional setup compared to simpler frameworks
* State management can become complex in large apps

---

## Backend — .NET API

### Why .NET?

* Enterprise-grade backend framework
* Strong performance and scalability
* Excellent support for API development
* Familiarity and experience

### Role in System

* Acts as API Gateway
* Handles validation and orchestration
* Manages configuration
* Stores chat history

### Trade-offs

* Slightly heavier than Node.js for lightweight APIs
* Requires integration effort with Python services

---

## AI Layer — FastAPI (Python)

### Why FastAPI?

* High performance (async support)
* Ideal for AI/ML integration
* Easy integration with LangChain & LangGraph
* Lightweight and fast to develop

### Role in System

* Document processing (chunking, embedding)
* RAG pipeline execution
* LLM interaction
* Agent-based reasoning

### Trade-offs

* Requires separate deployment from .NET
* Cross-language communication overhead

---

## AI Framework — LangChain + LangGraph

### Why LangChain?

* Simplifies LLM integration
* Built-in support for RAG pipelines
* Modular and extensible

### Why LangGraph?

* Enables agent-based workflows
* Supports loops, conditional logic, and state management
* Ideal for complex AI flows

### Trade-offs

* Rapidly evolving ecosystem (breaking changes possible)
* Learning curve for advanced usage

---

## LLM — Ollama (Configurable)

### Why Ollama?

* Runs locally (no API cost)
* Fast response time
* Good for POC and demos
* Supports models like Phi-3, Mistral

### Configurable Design

* System supports switching to:

  * OpenAI
  * Azure OpenAI
* Controlled via configuration file

### Trade-offs

* Local models may be less accurate than cloud models
* Requires local setup and resources

---

## Database — SQL Server

### Why SQL Server?

* Reliable and enterprise-ready
* Strong relational capabilities
* Already widely used in backend systems

### Role in System

* Store chat history
* Store document chunks
* Store embeddings (vector format)

### Trade-offs

* Not a native vector database
* Requires custom handling for similarity search

---

## Vector Storage Strategy

### Decision

* Store embeddings directly in SQL Server (as arrays/JSON)

### Why?

* Avoid external dependencies (like Pinecone)
* Demonstrates custom implementation capability
* Keeps system self-contained

### Trade-offs

* Slower than specialized vector DBs
* Requires manual similarity computation

---

## Configuration Strategy

### Decision

* Use config file to control:

  * LLM provider
  * Model selection
  * Chunk size
  * Retrieval settings

### Why?

* No code changes required for system tuning
* Enables flexibility and extensibility
* Supports future UI-based config management

---

## Communication Strategy

### Decision

* .NET communicates with FastAPI via HTTP APIs

### Why?

* Simple and widely used
* Language-independent communication
* Easy to debug and test

### Trade-offs

* Slight latency compared to in-process calls

---

## Summary

The chosen tech stack balances:

* Performance 
* Flexibility 
* Scalability 
* Real-world applicability 

DocuMind AI is designed not just as a demo project, but as a production-style AI system.
