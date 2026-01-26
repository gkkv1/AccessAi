# AI Technology Guide - ACCESS.AI

> **Understanding the AI Technologies Powering Your Accessibility Platform**

---

## 📋 Table of Contents

1. [RAG (Retrieval-Augmented Generation)](#1-rag-retrieval-augmented-generation)
2. [LangChain Framework](#2-langchain-framework)
3. [Vector Embeddings](#3-vector-embeddings)
4. [Vector Database (pgvector)](#4-vector-database-pgvector)
5. [Other AI Concepts](#5-other-ai-concepts)
6. [Complete AI Pipeline](#6-complete-ai-pipeline-visualization)
7. [AI Models Reference](#7-ai-models-reference)
8. [Key Concepts Summary](#8-key-concepts-summary)

---

## 1. RAG (Retrieval-Augmented Generation)

### ✅ YES, You're Using It!

**Location:** [`backend/app/services/rag_service.py`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py)

### What is RAG?

RAG combines two AI techniques:
- **Retrieval**: Finding relevant information from your documents using vector search
- **Generation**: Using an LLM (like GPT-4) to generate answers based on that retrieved information

### How RAG Works in Your Application

```
User Question: "What is the vacation policy?"
         ↓
┌─────────────────────────────────────────────┐
│ Step 1: RETRIEVAL (Find relevant chunks)    │
└─────────────────────────────────────────────┘
    - Convert question to embedding vector using OpenAI
    - Search your vector database (pgvector) for similar chunks
    - Return top 5 most relevant document chunks
         ↓
┌─────────────────────────────────────────────┐
│ Step 2: AUGMENTATION (Add context)          │
└─────────────────────────────────────────────┘
    - Take retrieved chunks: "[Page 2] Vacation policy allows 20 days..."
    - Add them as context to GPT-4 prompt
         ↓
┌─────────────────────────────────────────────┐
│ Step 3: GENERATION (LLM creates answer)     │
└─────────────────────────────────────────────┘
    - GPT-4 reads the context + question
    - Generates natural language answer with citations
    - Returns: "According to Page 2, you get 20 days vacation..."
```

### Your RAG Implementation

**Location:** [`rag_service.py:131-162`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L131-L162)

```python
async def chat(self, db: Session, doc_id: str, query: str) -> str:
    """
    Context-aware chat with a specific document.
    """
    # RETRIEVAL: Get relevant context from vector DB
    results = await self.search(db, query, doc_id)
    context_text = "\n\n".join([f"[Page {r.page}] {r.snippet}" for r in results])
    
    # AUGMENTATION: Build prompt with retrieved context
    system_prompt = (
        "You are a friendly, helpful accessibility assistant..."
        "Use the provided Context to answer the User's Question..."
    )
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Context:\n{context_text}\n\nQuestion: {query}")
    ]
    
    # GENERATION: LLM generates answer
    response = self.llm.invoke(messages)
    return response.content
```

### Why RAG is Powerful

| Benefit | Description |
|---------|-------------|
| **Accuracy** | Prevents hallucinations - GPT can't make up facts when grounded in your documents |
| **Cost-Effective** | Only sends relevant context to GPT (not entire 100-page PDF) |
| **Citations** | Can reference exact page numbers from source material |
| **Up-to-date** | Works with your latest documents without retraining models |

---

## 2. LangChain Framework

### ✅ YES, You're Using It!

**Location:** [`backend/app/services/rag_service.py:6-9`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L6-L9)

### What is LangChain?

A framework that simplifies building AI applications by providing pre-built components for:
- Document loading (PDF, TXT)
- Text splitting
- Embeddings
- LLM integration

### Your LangChain Components

```python
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
```

### Component Breakdown

| LangChain Component | Purpose | Your Usage |
|---------------------|---------|------------|
| **PyPDFLoader** | Loads PDF files and extracts text | `loader = PyPDFLoader(db_doc.file_path)` |
| **TextLoader** | Loads plain text files | `loader = TextLoader(db_doc.file_path)` |
| **RecursiveCharacterTextSplitter** | Splits long documents into chunks | Creates 1000-char chunks with 200 overlap |
| **OpenAIEmbeddings** | Converts text to vectors | Uses `text-embedding-3-small` model |
| **ChatOpenAI** | Interfaces with GPT models | Uses GPT-4o/3.5-turbo |

### Document Ingestion Pipeline

**Location:** [`rag_service.py:32-89`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L32-L89)

```python
async def ingest_document(self, db: Session, doc_id: str):
    # 1. Load File using LangChain
    if db_doc.file_type.lower() == "pdf":
        loader = PyPDFLoader(db_doc.file_path)
    else:
        loader = TextLoader(db_doc.file_path)
    
    raw_docs = loader.load()
    
    # 2. Split Text using LangChain
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True
    )
    chunks = text_splitter.split_documents(raw_docs)
    
    # 3. Generate Embeddings using LangChain
    for i, chunk in enumerate(chunks):
        vector = self.embeddings.embed_query(chunk.page_content)
        # Save to database...
```

---

## 3. Vector Embeddings

### ✅ YES, You're Using Them!

**Location:** [`rag_service.py:19-23`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L19-L23)

### What are Embeddings?

Mathematical representations of text as numbers (vectors) that capture semantic meaning.

### Example

```
Text: "vacation policy"
     ↓ (OpenAI Embeddings API)
Vector: [0.0234, -0.0891, 0.1234, ..., 0.0456]  # 1536 dimensions
```

### Why Embeddings are Magical

Similar text = Similar vectors. This enables **semantic search**:

```
Query: "How many days off do I get?"
Embedding: [0.0221, -0.0899, 0.1240, ...]

Document Chunk A: "Employees receive 20 vacation days annually"
Embedding: [0.0230, -0.0887, 0.1235, ...]
Distance: 0.05 (very close!) ✅ MATCHED!

Document Chunk B: "The parking lot opens at 8 AM"
Embedding: [0.8721, 0.3456, -0.7890, ...]
Distance: 1.92 (very far) ❌ NOT RELEVANT
```

### Your Implementation

```python
# Initialize embeddings
self.embeddings = OpenAIEmbeddings(
    openai_api_key=api_key,
    model="text-embedding-3-small",  # 1536 dimensions
    openai_api_base=base_url
)

# Generate embedding for a document chunk
vector = self.embeddings.embed_query(chunk.page_content)

# Store in database
db_chunk = AccessDocumentChunk(
    text_content=chunk.page_content,
    embedding=vector,  # Store the 1536-dimensional vector
    page_number=chunk.metadata.get("page", 0) + 1
)
```

---

## 4. Vector Database (pgvector)

### ✅ YES, You're Using It!

**Location:** PostgreSQL database with pgvector extension

### What is pgvector?

A PostgreSQL extension that enables storing and searching vectors efficiently.

### Traditional Search vs. Vector Search

```
❌ TRADITIONAL (Keyword Matching):
Query: "time off"
Document: "vacation days" → NO MATCH (different words)

✅ VECTOR SEARCH (Semantic):
Query: "time off"
Document: "vacation days" → MATCH! (similar meaning)
```

### Your Vector Search Implementation

**Location:** [`rag_service.py:90-129`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L90-L129)

```python
async def search(self, db: Session, query: str, doc_id: str = None) -> list[SearchResult]:
    # 1. Convert query to vector
    query_vector = self.embeddings.embed_query(query)
    
    # 2. Find closest vectors using L2 distance
    distance_col = AccessDocumentChunk.embedding.l2_distance(query_vector).label("distance")
    
    # 3. Query database for similar chunks
    query_obj = db.query(AccessDocumentChunk, DocumentModel, distance_col).join(DocumentModel)
    
    if doc_id:
        query_obj = query_obj.filter(AccessDocumentChunk.document_id == doc_id)
    
    # 4. Get top 5 most similar chunks
    results = query_obj.order_by(distance_col).limit(5).all()
    
    # 5. Calculate relevance scores
    for chunk, doc, distance in results:
        dist_val = float(distance)
        similarity = 1 - (dist_val * dist_val) / 2
        relevance = max(0.0, min(1.0, similarity))
        # Return results...
```

### Distance Metric: L2 (Euclidean) Distance

- **0.0** = Identical vectors (perfect match)
- **1.0** = Moderately different
- **2.0** = Completely opposite

Your code converts this to a **relevance score (0-1)**:
- **1.0** = Highly relevant
- **0.5** = Moderately relevant
- **0.0** = Not relevant

---

## 5. Other AI Concepts

### A. Prompt Engineering ✅

**What**: Crafting instructions for the LLM to get better responses.

**Your System Prompt** ([`rag_service.py:144-153`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L144-L153)):

```python
system_prompt = (
    "You are a friendly, helpful accessibility assistant designed to help users understand a document.\n"
    "Use the provided Context to answer the User's Question.\n"
    "Rules:\n"
    "- If the user says 'Hi', 'Hello', or 'Thanks', respond politely and professionally without making up facts.\n"
    "- If the user asks to **summarize** the document, tell them: 'For a full document summary and simplified view, please click the **Simplify** button (Magic Wand icon) in the toolbar.'\n"
    "- If the answer is not in the context, say: 'I couldn't find information about that in this document.'\n"
    "- Keep answers concise (under 3 sentences) unless asked for details.\n"
    "- Cite page numbers if possible (e.g., 'According to Page 2...')."
)
```

**Why This Matters**: Good prompts = Better AI responses!

---

### B. Text Chunking ✅

**What**: Breaking long documents into smaller pieces for better processing.

**Your Chunking Strategy** ([`rag_service.py:54-59`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L54-L59)):

```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # Max 1000 characters per chunk
    chunk_overlap=200,    # 200 char overlap to preserve context
    add_start_index=True  # Track position in original doc
)
```

**Why Overlap?**

```
Chunk 1: "...employees get 20 vacation days. This policy..."
Chunk 2: "...This policy applies to full-time staff..."
         ↑ Overlap ensures sentences aren't cut mid-context
```

---

### C. Temperature (Creativity Control) ✅

**What**: Controls randomness in LLM responses.

**Your Setting** ([`rag_service.py:27`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L27)):

```python
temperature=0  # Very deterministic (same question = same answer)
```

| Temperature | Behavior | Use Case |
|-------------|----------|----------|
| **0.0** | Deterministic, factual | Your RAG (needs consistency) ✅ |
| **0.7** | Balanced creativity | General chat |
| **1.5** | Very creative | Story writing |

---

### D. Token Limits ✅

**What**: Controlling cost and response length.

**Your Setting** ([`rag_service.py:29`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L29)):

```python
max_tokens=1000  # Limit output to ~750 words
```

**Why**: Prevents runaway API costs and ensures concise responses.

---

## 6. Complete AI Pipeline Visualization

### Your Full Document Intelligence Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   STEP 1: DOCUMENT INGESTION                        │
│                      (ingest_document method)                       │
└─────────────────────────────────────────────────────────────────────┘

User uploads PDF (e.g., "Employee_Handbook.pdf")
         ↓
PyPDFLoader extracts all text from PDF
         ↓
RecursiveTextSplitter breaks document into chunks
  - Chunk 1: "Welcome to our company..."
  - Chunk 2: "...company. Our values include..."
  - Chunk 3: "...include teamwork. Vacation policy..."
         ↓
OpenAI Embeddings API creates vectors for each chunk
  - Chunk 1 → [0.123, -0.456, ...]
  - Chunk 2 → [0.789, 0.234, ...]
  - Chunk 3 → [-0.345, 0.678, ...]
         ↓
Store chunks + vectors in PostgreSQL with pgvector
  ✅ Document ready for search!


┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 2: SEMANTIC SEARCH                          │
│                         (search method)                             │
└─────────────────────────────────────────────────────────────────────┘

User asks: "What's the vacation policy?"
         ↓
OpenAI creates query embedding
  Query → [0.221, -0.443, 0.789, ...]
         ↓
pgvector finds 5 closest chunk embeddings using L2 distance
  - Chunk 3: Distance 0.08 (very close!)
  - Chunk 47: Distance 0.12
  - Chunk 89: Distance 0.19
  - Chunk 12: Distance 0.23
  - Chunk 56: Distance 0.31
         ↓
Calculate relevance scores (0-1)
  - Chunk 3: 0.92 (highly relevant)
  - Chunk 47: 0.85
  - ...
         ↓
Return ranked search results with page numbers
  ✅ Top 5 relevant chunks retrieved!


┌─────────────────────────────────────────────────────────────────────┐
│                      STEP 3: RAG CHAT                               │
│                        (chat method)                                │
└─────────────────────────────────────────────────────────────────────┘

User question: "What's the vacation policy?"
         ↓
Retrieve context using search() method
  Context = "[Page 5] Employees receive 20 vacation days annually..."
         ↓
Build GPT-4 prompt:
  - System: "You are a helpful accessibility assistant..."
  - Context: "[Page 5] Employees receive 20 vacation days..."
  - Question: "What's the vacation policy?"
         ↓
GPT-4 generates natural language answer
         ↓
Response: "According to Page 5, employees receive 20 vacation days..."
  ✅ User gets accurate, cited answer!
```

---

## 7. AI Models Reference

### Models You're Using

| Model | Provider | Purpose | Dimensions/Size | Cost |
|-------|----------|---------|-----------------|------|
| **text-embedding-3-small** | OpenAI | Convert text→vectors | 1536 dimensions | $0.02/1M tokens |
| **gpt-4o** | OpenAI | Chat, simplification, analysis | - | $2.50/$10 per 1M tokens |
| **gpt-3.5-turbo** | OpenAI | Cheaper alternative for simple tasks | - | $0.50/$1.50 per 1M tokens |
| **whisper-1** | OpenAI | Audio transcription | - | $0.006/minute |

### Model Selection Logic

**Location:** [`rag_service.py:24-30`](file:///c:/Users/hp/OneDrive/Desktop/Fullstack/backend/app/services/rag_service.py#L24-L30)

```python
self.llm = ChatOpenAI(
    openai_api_key=api_key,
    model_name=settings.LLM_MODEL,  # Configurable: gpt-4o or gpt-3.5-turbo
    temperature=0,
    openai_api_base=base_url,
    max_tokens=1000
)
```

**Best Practices**:
- Use **GPT-3.5-turbo** for simple queries (10x cheaper)
- Use **GPT-4o** for complex analysis requiring deeper reasoning
- Configure via environment variable `LLM_MODEL`

---

## 8. Key Concepts Summary

### AI Technologies Checklist

✅ **RAG (Retrieval-Augmented Generation)**: Combining search + GPT for accurate, grounded answers  
✅ **LangChain**: Framework simplifying AI workflows (loaders, splitters, embeddings)  
✅ **Vector Embeddings**: Text as numbers for semantic similarity  
✅ **pgvector**: PostgreSQL extension for vector storage/search  
✅ **Semantic Search**: Meaning-based search (not keyword matching)  
✅ **Chunking**: Breaking documents into processable pieces  
✅ **Prompt Engineering**: Crafting effective LLM instructions  
✅ **Temperature**: Controlling LLM creativity  
✅ **Token Limits**: Managing cost and output length  

---

## 🎯 Why This Architecture is Production-Grade

### 1. **Accuracy**
RAG prevents hallucinations - GPT can't make up facts when grounded in your documents.

### 2. **Scalability**
Vector search handles thousands of documents efficiently with sub-second query times.

### 3. **Cost-Effective**
Only relevant context (top 5 chunks) is sent to GPT, not entire documents.

### 4. **Semantic Understanding**
Finds "vacation days" when user asks about "time off" - understands meaning, not just keywords.

### 5. **Citations**
Always references exact page numbers from source material for verification.

### 6. **Flexibility**
Works with any document type and can be easily adapted to other domains.

---

## 📚 Further Reading

### LangChain Documentation
- [LangChain Docs](https://python.langchain.com/docs/get_started/introduction)
- [Document Loaders](https://python.langchain.com/docs/modules/data_connection/document_loaders/)
- [Text Splitters](https://python.langchain.com/docs/modules/data_connection/document_transformers/)

### OpenAI Documentation
- [Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [GPT-4 API](https://platform.openai.com/docs/models/gpt-4)
- [Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

### Vector Databases
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Vector Search Explained](https://www.pinecone.io/learn/vector-database/)

### RAG Resources
- [RAG Explained](https://aws.amazon.com/what-is/retrieval-augmented-generation/)
- [Building RAG Applications](https://www.databricks.com/glossary/retrieval-augmented-generation-rag)

---

## 📝 Quick Reference Card

### Command Cheat Sheet

```bash
# Install LangChain dependencies
pip install langchain langchain-openai langchain-community

# Install vector database
pip install pgvector psycopg2-binary

# Set environment variables
export OPENAI_API_KEY="sk-..."
export LLM_MODEL="gpt-4o"  # or "gpt-3.5-turbo"
export DATABASE_URL="postgresql://..."
```

### Code Snippets

**Basic RAG Query:**
```python
# Search documents
results = await rag_service.search(db, "vacation policy")

# Chat with document
answer = await rag_service.chat(db, doc_id, "How many vacation days?")

# Simplify text
simplified = await rag_service.simplify("Complex legal text...")
```

---

*This guide is part of the ACCESS.AI documentation. For more information, see [`AI_CAPABILITIES.md`](./AI_CAPABILITIES.md) and [`ARCHITECTURE.md`](../ARCHITECTURE.md).*
