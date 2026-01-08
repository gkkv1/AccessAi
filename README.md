# ACCESS.AI - Intelligent Accessible Document Portal

**ACCESS.AI** is a full-stack intelligent document portal designed to empower employees with disabilities to independently access, understand, and interact with workplace documents. By leveraging cutting-edge Generative AI (GPT-4 Vision, RAG, Whisper), it removes barriers for users with visual, cognitive, hearing, and motor impairments.

---

## 🌍 Real-World Problem & Solution

Based on analysis of the codebase, here is how **AccessDoc AI** solves real-world accessibility problems:

### 1. Visual Impairments (Blindness, Low Vision)
*   **Problem**: Users cannot see document content (images, charts, scanned text) or struggle with standard UI contrast/size.
*   **Solution**:
    *   **AI Vision Analysis** (`vision_service.py`): Uses GPT-4 Vision to "see" and describe images, charts, and diagrams in documents, making visual content accessible to screen readers.
    *   **Voice Navigation** (`VoiceInput.tsx`): Allows users to control the app and search for documents using their voice, bypassing the need for visual relying on mouse/keyboard.
    *   **Adaptive UI** (`AccessibilityToolbar.tsx`): Provides **High Contrast** mode and **Text Resizing** (up to 200%) to accommodate low-vision users.

### 2. Cognitive & Learning Disabilities (Dyslexia, ADHD)
*   **Problem**: Users may find complex legal/technical language or standard fonts difficult to read and process. Motion can be distracting.
*   **Solution**:
    *   **Text Simplification** (`rag_service.py`): The `simplify` feature uses AI to rewrite complex document text into plain, easy-to-understand language.
    *   **Dyslexia-Friendly Mode** (`AccessibilityToolbar.tsx`): Toggles the **Atkinson Hyperlegible** font, specifically designed to improve reading character recognition.
    *   **Reduce Motion**: A setting to minimize animations, helping users who are easily distracted or sensitive to motion.

### 3. Hearing Impairments (Deaf, Hard of Hearing)
*   **Problem**: Users cannot access information from audio recordings or meetings.
*   **Solution**:
    *   **Meeting Transcription** (`speech_service.py`): Uses Whisper AI to accurately transcribe audio files (like meeting recordings) into text, identifying different speakers.

### 4. Motor Impairments
*   **Problem**: Difficulty using a mouse or keyboard.
*   **Solution**:
    *   **Voice Control**: The `VoiceInput` component allows for hands-free operation of forms and search.
    *   **Keyboard Navigation**: The UI components (Radix UI based) support standard keyboard focusing and navigation.

**Summary**: Your application moves beyond standard compliance (contrast/fonts) by using **Generative AI** to solve "content" inaccessibility—making images, complex text, and audio accessible on demand.

---

## 🚀 Key Features

-   **📄 RAG-Powered Document Search**: Ask natural language questions about your documents (e.g., "What is the maternity leave policy?") and get instant, cited answers.
-   **👁️ AI Vision**: Automatically extracts and describes text/data from images and charts.
-   **🎙️ Voice Interface**: Full voice-controlled navigation and search.
-   **📝 Meeting Assistant**: Upload meeting recordings to get transcripts, summaries, and action items.
-   **✨ Smart Simplification**: "Explain this like I'm 5" button for any complex document section.
-   **wcag 2.2 AA Compliance**: Native support for screen readers, keyboard navigation, and high contrast.

---

## 🛠️ Tech Stack

### Frontend
-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
-   **Accessibility**: Radix UI Primitives, Lucide Icons
-   **State**: TanStack Query (React Query)

### Backend
-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
-   **AI Orchestration**: [LangChain](https://www.langchain.com/)
-   **Vector Database**: [Pinecone](https://www.pinecone.io/)
-   **Database**: PostgreSQL + pgvector
-   **AI Models**:
    -   *Vision*: GPT-4o / GPT-4 Vision
    -   *Reasoning*: GPT-4 Turbo
    -   *Audio*: Open AI Whisper API

---

## 🏗️ Architecture

```mermaid
graph TD
    User[User (Voice/Text)] --> Frontend[React Frontend]
    Frontend -->|API Requests| Backend[FastAPI Backend]
    
    subgraph Backend Services
        Backend --> Auth[Auth Middleware]
        Backend --> Vision[Vision Service (GPT-4V)]
        Backend --> RAG[RAG Service]
        Backend --> Speech[Speech Service (Whisper)]
    end
    
    subgraph Data & AI
        RAG --> Pinecone[(Pinecone Vector DB)]
        RAG --> OpenAI[OpenAI GPT-4]
        Vision --> OpenAI
        Speech --> OpenAI
        Backend --> DB[(PostgreSQL)]
    end
```

---

## ⚡ Setup Instructions

### Prerequisites
*   Node.js 18+
*   Python 3.10+
*   PostgreSQL installed and running
*   API Keys: OpenAI, Pinecone

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/access-ai.git
cd access-ai
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
# Activate: Windows
.\venv\Scripts\activate
# Activate: Mac/Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment
cp .env.example .env
# Edit .env with your API keys
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🔑 Configuration (.env)

Create a `.env` file in the `backend/` directory:

```ini
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENV=gcp-starter
DATABASE_URL=postgresql://user:password@localhost/accessai
```

---

## 🧪 Testing

*   **API Docs**: Visit `http://localhost:8000/docs` to test backend endpoints.
*   **Accessibility**: Use the toolbar in the top-right corner to toggle High Contrast or Dyslexia Font.

---

## 📄 License

This project is licensed under the MIT License.
