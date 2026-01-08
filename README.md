# ACCESS.AI - Intelligent Accessible Document Portal

ACCESS.AI is a full-stack application designed to enable employees with disabilities to independently access workplace documents, forms, and meetings using AI-powered tools.

## Features

- **Document Analysis**: Upload PDFs/Docs and search them using natural language (RAG).
- **Voice Interface**: Navigate and query the system using voice commands.
- **Meeting Transcription**: Real-time audio transcription with speaker detection and action item extraction.
- **Text Simplification**: Convert complex legal/policy text into plain English.
- **Accessible Design**: High contrast, dyslexia-friendly fonts, and screen reader compatibility (WCAG 2.2 AA).

## Tech Stack

### Frontend
- **Framework**: React (Vite)
- **UI Library**: Shadcn/UI + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Accessibility**: Radix UI Primitives

### Backend
- **Framework**: Python FastAPI
- **Database**: PostgreSQL + pgvector (Embeddings)
- **Vector Store**: Pinecone
- **AI Models**: OpenAI GPT-4 Vision, GPT-4 Turbo, Whisper API

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL
- OpenAI API Key
- Pinecone API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repo-url>
    cd access-ai
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    .\venv\Scripts\activate  # Windows
    pip install -r requirements.txt
    cp .env.example .env     # Configure API keys
    uvicorn app.main:app --reload
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## API Documentation

Once the backend is running, verify the API docs at:
`http://localhost:8000/docs`

## License
MIT
