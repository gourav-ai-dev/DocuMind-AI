# DocuMind AI — Configuration Design

## Overview

This document defines how system configuration is managed in DocuMind AI.

The system uses a **config-driven approach**, allowing changes to behavior without modifying code.

---

## Goals

* Enable dynamic switching of LLM providers
* Control RAG parameters (chunk size, topK, etc.)
* Allow easy updates via file or UI (future)
* Keep system flexible and extensible

---

## Config File Location

```
/config/appsettings.json   (.NET)
```

or

```
/ai-service/config.json    (FastAPI)
```

---

## Sample Configuration

```json
{
  "llm_provider": "ollama",

  "ollama": {
    "model": "phi3",
    "base_url": "http://localhost:11434"
  },

  "openai": {
    "api_key": "",
    "model": "gpt-4o-mini"
  },

  "rag": {
    "chunk_size": 500,
    "chunk_overlap": 50,
    "top_k": 5
  },

  "database": {
    "connection_string": "Your_SQL_Server_Connection_String"
  }
}
```

---

## LLM Provider Switching

### Supported Providers

* Ollama (default)
* OpenAI (future)
* Azure OpenAI (future)

### How It Works

* System reads `llm_provider` value
* Loads corresponding configuration
* Routes requests to selected provider

---

## RAG Configuration

### Parameters:

* `chunk_size`: Size of each text chunk
* `chunk_overlap`: Overlap between chunks
* `top_k`: Number of chunks retrieved during query

### Purpose:

* Improve retrieval accuracy
* Optimize performance
* Allow tuning without code changes

---

## Database Configuration

* Stores connection string
* Can be updated for different environments (local, prod)

---

## Security Considerations

* API keys should not be hardcoded
* Use environment variables for sensitive data
* Config file should exclude secrets in production

---

## Future Enhancement — UI Config Panel

### Planned Feature:

* React-based UI to modify config
* Save changes dynamically
* No restart required (optional enhancement)

---

## Design Principles

* Centralized configuration
* Environment-independent setup
* Extensible for new providers and tools
* Minimal code dependency on config changes

---

## Benefits

* Switch LLM without code changes
* Tune system performance easily
* Enable rapid experimentation
* Improve maintainability

---

## Summary

The configuration system makes DocuMind AI flexible, scalable, and production-ready by allowing dynamic control over AI behavior and system parameters.
