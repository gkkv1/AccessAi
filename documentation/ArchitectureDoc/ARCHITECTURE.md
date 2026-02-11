# System Architecture & Data Flow

This document outlines the high-level architecture and detailed data flows for the AI-Native Application.

## 1. High-Level Architecture

```mermaid
graph TD
    subgraph Client [Frontend - React/Vite]
        UI[User Interface]
        AuthUI[Auth Components]
        DocUI[Document Viewer]
        ChatUI[Chat Interface]
        FormUI[Smart Form Interface]
        TransUI[Transcription Dashboard]
    end

    subgraph Backend [FastAPI Server]
        API[API Gateway / Router]
        
        subgraph Services
            AuthSvc[Auth Service]
            DocSvc[Document Service]
            RAGSvc[RAG/Vector Service]
            FormSvc[Form Extraction Service]
            TransSvc[Transcription Service]
        end
        
        subgraph DataAccess
            ORM[SQLAlchemy ORM]
        end
    end

    subgraph Database [PostgreSQL + pgvector]
        UserTable[(Users Table)]
        UserProfile[(User Profile Data)]
        DocTable[(Documents Table)]
        VectorStore[(Vector Embeddings)]
        FormTable[(Forms Table)]
        TransTable[(Transcriptions)]
    end

    subgraph AI_Cloud [OpenAI Cloud]
        GPT[GPT-4o API]
        Embed[Text-Embedding-3]
        Whisper[Whisper API]
    end

    %% Connections
    UI -->|HTTP/REST| API
    API --> AuthSvc
    API --> DocSvc
    API --> RAGSvc
    API --> FormSvc
    API --> TransSvc

    AuthSvc --> ORM
    DocSvc --> ORM
    RAGSvc --> ORM
    FormSvc --> ORM
    TransSvc --> ORM

    ORM --> UserTable
    ORM --> UserProfile
    ORM --> DocTable
    ORM --> VectorStore
    ORM --> FormTable
    ORM --> TransTable

    RAGSvc -->|Embed Query/Docs| Embed
    RAGSvc -->|Generate Answers| GPT
    FormSvc -->|Extract/Fill Data| GPT
    TransSvc -->|Transcribe Audio| Whisper
    TransSvc -->|Analyze Sentiment/Actions| GPT
```

## 2. Authentication Flow (Biometric & Standard)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as PostgreSQL

    U->>FE: Enters Credentials / Scans Face
    FE->>API: POST /auth/login (email/pass OR face_signature)
    API->>DB: Query User & Validate Hash/FaceData
    alt Valid
        DB-->>API: User Record
        API-->>FE: Return JWT Access Token
        FE->>FE: Store Token (LocalStorage/Cookie)
    else Invalid
        API-->>FE: Error 401
    end
```

## 3. Document Ingestion Pipeline (The "Brain")
*How we turn a PDF into searchable AI memory.*

```mermaid
sequenceDiagram
    participant U as User
    participant API as Backend API
    participant G as Storage (Disk/S3)
    participant OAI as OpenAI (Embeddings)
    participant VDB as Postgres (pgvector)

    U->>API: Upload PDF/Text
    API->>G: Save File
    API->>API: Extract Text -> Chunk (500 tokens)
    loop For Each Chunk
        API->>OAI: Generate Embedding (text-embedding-3)
        OAI-->>API: Vector [0.1, -0.5, ...]
        API->>VDB: INSERT chunk_text + vector
    end
    API-->>U: Processing Complete
```

## 4. Semantic Search & RAG (Chat)
*Finding answers using the "Brain".*

```mermaid
sequenceDiagram
    participant U as User
    participant API as Backend API
    participant OAI as OpenAI (Embeddings)
    participant VDB as Postgres (pgvector)
    participant GPT as GPT-4o

    U->>API: "Summarize the vacation policy"
    API->>OAI: Generate Embedding for Query
    OAI-->>API: Query Vector
    API->>VDB: SELECT content FROM documents ORDER BY embedding <-> query_vector
    VDB-->>API: Relevant Context Chunks
    API->>GPT: Prompt: "Context: [Chunks]... Question: [Summarize policy]"
    GPT-->>API: "The vacation policy allows 20 days..."
    API-->>U: Final Answer
```

## 5. Smart Form System (Auto-Fill & Voice)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as Backend API
    participant DB as PostgreSQL
    participant AI as GPT-4o / Whisper

    note over U, AI: Scenario 1: Auto-Fill from Profile
    U->>UI: Opens "Medical History Form"
    UI->>API: GET /form/autofill?user_id=123
    API->>DB: Fetch User Profile
    DB-->>API: User Data
    API->>AI: Map User Data -> Form Fields
    AI-->>API: JSON Data
    API-->>UI: Pre-filled Form

    note over U, AI: Scenario 2: Smart Interview Mode (Chat)
    U->>UI: Enters "Interview Mode"
    loop Until Form Complete
        AI-->>UI: Ask Question: "What is the project name?"
        U->>UI: Speaks/Types: "The project is AccessAI"
        UI->>API: Send Response Context
        API->>AI: Analyze & Extract Data
        AI-->>API: { field_update: { "project_name": "AccessAI" }, next_question: "Great, when does it start?" }
        API-->>UI: Update Form & Ask Next Question
    end

    note over U, AI: Scenario 3: Voice-to-Form (Direct Field Input)
    U->>UI: Selects specific field & Speaks
    UI->>API: POST /audio/transcribe
    API->>AI: Whisper (Audio -> Text)
    AI-->>API: Text: "My symptoms started yesterday..."
    API-->>UI: Stick text into current field
```

## 6. Advanced Transcription (Live & Upload)

```mermaid
sequenceDiagram
    participant U as User
    participant API as Backend
    participant W as Whisper API
    participant GPT as GPT-4o
    participant DB as Database

    note over U, DB: A. Post-Meeting Analysis (Upload)
    U->>API: Upload Audio File
    API->>W: Transcribe Audio
    W-->>API: Full Transcript
    par Parallel Analysis
        API->>GPT: Extract Key Points & Action Items
    and
        API->>GPT: Analyze Sentiment (Radar Data)
    end
    API->>DB: Save Results
    API-->>U: Display Dashboard

    note over U, DB: B. Live Meeting (Real-Time Helper)
    loop Every 30s
        U->>UI: Recording Chunk...
        UI->>API: Send Audio
        API->>W: Transcribe
        API->>GPT: Identify Immediate Actions/Sentiment
        API-->>UI: Update Live View
    end
```
