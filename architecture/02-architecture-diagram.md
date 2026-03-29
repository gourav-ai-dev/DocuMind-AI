```mermaid
flowchart TD
    A[React UI] --> B[.NET API]
    B --> C[FastAPI AI Layer]
    C --> D[SQL Server]

    D --> C
    C --> B
    B --> A

    subgraph Frontend
        A
    end

    subgraph Backend
        B
    end

    subgraph AI_Layer
        C
    end

    subgraph Data_Layer
        D
    end
```
