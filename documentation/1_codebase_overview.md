# ACCESS.AI Codebase Overview

Welcome to the ACCESS.AI project! This document maps out the entire application flow, from the React frontend to the FastAPI backend and PostgreSQL database.

## 1. Project Structure

The project is split into two main directories:

- **`frontend/`**: A React application built with Vite, TypeScript, and Tailwind CSS.
- **`backend/`**: A Python FastAPI application using SQLAlchemy and Pydantic.

## 2. Frontend Architecture (`frontend/src`)

The frontend is the entry point for users. It handles authentication, routing, and UI rendering.

### Key Files
- **`App.tsx`**: The main application component. It sets up the global providers and routing.
    - **Providers**: `QueryClientProvider` (TanStack Query), `AuthProvider` (User state), `AccessibilityProvider` (UI adjustments).
    - **Routing**: Uses `react-router-dom`.
        - **Public Routes**: `/`, `/login`, `/register`.
        - **Protected Routes**: `/search`, `/documents`, `/forms`, `/transcribe` (wrapped in `PrivateRoute`).
- **`main.tsx`**: The bootstrapper that mounts `App.tsx` to the DOM.

### Core Pages & Features
1.  **Search (`/search`)**:
    -   **Page**: `pages/SearchPage.tsx`
    -   **Function**: Allows users to ask questions about uploaded documents.
    -   **Flow**: User Input -> `useChat` hook -> API `POST /api/v1/chat/` -> Backend RAG Service.
2.  **Documents (`/documents`)**:
    -   **Page**: `pages/DocumentsPage.tsx`
    -   **Function**: Upload and manage PDFs/Text files.
    -   **Flow**: Upload -> API `POST /api/v1/documents/upload` -> Vector Embedding -> DB Storage.
3.  **Forms (`/forms`)**:
    -   **Page**: `pages/FormsPage.tsx`
    -   **Function**: AI-assisted form filling using voice or profile data.
    -   **Flow**: Voice Input -> API `POST /api/v1/transcribe` -> Text-to-JSON -> Form Autofill.
4.  **Transcribe (`/transcribe`)**:
    -   **Page**: `pages/TranscribePage.tsx`
    -   **Function**: Real-time or file-based audio transcription.

## 3. Backend Architecture (`backend/app`)

The backend exposes a REST API to handle business logic, database interactions, and AI processing.

### Key Files
-   **`main.py`**: The application entry point.
    -   Initializes `FastAPI` app.
    -   Sets up **CORS** middleware.
    -   Connects to the **Database**.
    -   Includes the main `api_router`.
-   **`api/api.py`**: Aggregates all service routers.
    -   `/auth` -> `api.auth`
    -   `/documents` -> `api.documents`
    -   `/chat` -> `api.chat`
    -   `/forms` -> `api.forms`
    -   `/transcribe` -> `api.transcribe`

### Core Services & Logic
1.  **Authentication (`api/auth.py`)**:
    -   Handles Login/Register using JWT tokens.
    -   Supports Biometric login (simulated via face signature).
2.  **Document Service (`api/documents.py`)**:
    -   Handles file uploads.
    -   **Ingestion Pipeline**: Read File -> Chunk Text -> Generate OpenAI Embeddings -> Store in `pgvector`.
3.  **Chat/RAG Service (`api/chat.py`)**:
    -   **Retrieval Augmented Generation (RAG)**:
        1.  Receive user query.
        2.  Generate embedding for query.
        3.  Search `pgvector` for similar document chunks.
        4.  Send context + query to GPT-4o.
        5.  Return answer.

## 4. End-to-End Data Flow Examples

### A. Document Upload Flow
1.  **Frontend**: User uploads `policy.pdf` on `DocumentsPage`.
2.  **API**: `POST /api/v1/documents/upload` receives file.
3.  **Backend**:
    -   Saves file to `uploads/` directory.
    -   Extracts text content.
    -   Splits text into chunks.
    -   Calls OpenAI to get vector embeddings for each chunk.
    -   Saves Document metadata and Vector Chunks to PostgreSQL.
4.  **Frontend**: Refetches document list and shows status "Processed".

### B. "Ask a Question" Flow
1.  **Frontend**: User asks "What is the vacation policy?" on `SearchPage`.
2.  **API**: `POST /api/v1/chat/` receives the string.
3.  **Backend**:
    -   Embeds the question.
    -   Queries DB: `SELECT * FROM chunks ORDER BY embedding <-> query_embedding LIMIT 5`.
    -   Constructs Prompt: "Answer 'What is vacation policy?' using these chunks: [...]".
    -   Calls GPT-4o.
4.  **Frontend**: Displays the AI response.

## 5. Getting Started for New Developers

1.  **Run Backend**:
    -   `cd backend`
    -   Active venv: `source venv/bin/activate` (or `.\venv\Scripts\activate`)
    -   Start Server: `uvicorn app.main:app --reload` (Runs on port 8000)
    -   Docs: Visit `http://localhost:8000/docs` for Swagger UI.
2.  **Run Frontend**:
    -   `cd frontend`
    -   Start Dev Server: `npm run dev` (Runs on port 5173)
3.  **Database**:
    -   Ensure PostgreSQL is running.
    -   Check `.env` for `DATABASE_URL`.
