
# ACCESS.AI 🚀
**Empowering the Inclusive Workplace through Adaptive Intelligence**

> *Breaking down digital barriers for employees with disabilities using Multi-Modal AI.*

![Banner](https://img.shields.io/badge/Status-Hackathon_MVP-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Compliance](https://img.shields.io/badge/WCAG-2.2_AA-orange)

## 📌 The Problem
1.3 billion people globally live with significant disability. In the workplace, they face daily friction:
- **Complex UI/UX** confusing neurodivergent users.
- **Unreadable Documents** blocking visually impaired employees.
- **Physical Strain** from repetitive typing for those with motor impairments.
- **Communication Barriers** in meetings for deaf/hard-of-hearing staff.

## 💡 The Solution: ACCESS.AI
ACCESS.AI is a unified workspace platform that adapts to the user, not the other way around. By leveraging **Generative AI**, **Computer Vision**, and **Voice Recognition**, we create a frictionless digital environment.

## ✨ Key Features (AI-Powered)

### 1. Neural Biometric Authentication 🔐
*For users with motor/memory impairments.*
- **Face ID & Fingerprint Analysis**: Uses advanced computer vision to authenticate users without typing complex passwords.
- **Liveness Detection**: Ensures security while maintaining zero-friction access.

### 2. Cognitive Document Intelligence 📄
*For visual impairment & dyslexia.*
- **Smart RAG Search**: Talk to your documents. Uses Vector Search (RAG) to find answers in 100-page policy PDFs instantly.
- **Intelligent Simplification**: One-click LLM transformation of legalese into simple, bulleted summaries (CEFR Level B1).
- **Nuanced Text-to-Speech**: Neural TTS engine that reads documents with natural prosody.

### 3. Universal Voice Interface 🎙️
*For mobility impairments.*
- **Intent Recognition**: Navigate the entire app using voice commands ("Open Leave Forms", "Find the compliance report").
- **Voice-to-Text Fields**: Dictate long form entries with Whisper-level accuracy.

### 4. Predictive Context-Aware Forms 📝
*Reducing cognitive load.*
- **Auto-Fill AI**: Anticipates user data based on role and history (e.g., auto-filling Manager Name, Dept) to reduce keystrokes by 80%.
- **Smart Validation**: Guides users gently through errors instead of rejecting submissions.

### 5. Live Meeting Accessibility 💬
*For deaf/hard-of-hearing.*
- **Real-Time Diarization**: Separates speakers in real-time.
- **Active Listening Agent**: Extracts **Key Concepts** and **Action Items** automatically during the call, ensuring no context is lost.

---

## � Real-World Scenarios & Impact

### Scenario A: The Visually Impaired Analyst
**The Problem:**
James, a financial analyst with low vision, struggles with internal compliance PDFs. Screen readers often fail on unstructured documents, and "text-heavy" layouts cause severe eye strain. He normally waits 2-3 days for a colleague to summarize updates for him.

**The ACCESS.AI Solution:**
James uploads the PDF to **Document Intelligence**.
1.  **Smart View** instantly reformats the text to Yellow-on-Black (High Contrast) and size 24px.
2.  He presses **"Listen"**, and the neural TTS reads the policy while he sips coffee.
3.  He asks the **Chat Assistant**: "What are the new reporting deadlines?" and gets an instant, citation-backed answer.
**Result:** James completes his review in 15 minutes, independently.

### Scenario B: The Developer with Repetitive Strain Injury (RSI)
**The Problem:**
Sarah, a senior dev, has severe carpal tunnel syndrome. Every keystroke is painful. Filling out her monthly expense reports and project allocation forms is a physical ordeal that exacerbates her injury.

**The ACCESS.AI Solution:**
Sarah navigates to **Predictive Forms**.
1.  **Face ID** logs her in instantly—no typing passwords.
2.  She opens the "Expense" form. The system **Auto-Fills** her Name, ID, Department, and Manager.
3.  She taps the **Mic** and says: *"Uber ride to client meeting, $45, yesterday."*
4.  The system parses the intent, fills the fields, and she says *"Submit"*.
**Result:** A 20-minute typing task is reduced to 30 seconds of voice commands. Zero pain.

### Scenario C: The Neurodivergent Project Manager (ADHD)
**The Problem:**
David has ADHD and finds long, droning meetings difficult to follow. He often misses actionable tasks buried in 45 minutes of conversation, leading to anxiety and dropped balls.

**The ACCESS.AI Solution:**
David turns on **Live Meeting Assistant**.
1.  As the team speaks, **Real-Time Captions** keep him visually engaged.
2.  The **Active Listening Agent** highlights "Key Concepts" in the sidebar as they occur.
3.  At the end, he receives a structured list of **Action Items** (e.g., *"David to email Q3 report by Friday"*), automatically extracted from the audio.
**Result:** David feels confident and organized, with a generated checklist ready to go.

### Scenario D: The Dyslexic HR Coordinator
**The Problem:**
Emily works in HR but finds parsing dense legal text exhausting due to dyslexia. The "Wall of Text" effect makes it hard to distinguish between updated clauses and standard boilerplate.

**The ACCESS.AI Solution:**
Emily uses the **Simplify** feature.
1.  She opens the new "Workplace Harassment Policy".
2.  She toggles **"Dyslexic Font"** (OpenDyslexic) for better readability.
3.  She clicks **"Simplify"**. The 10-page document is transformed into a **Summary View**:
    *   *Clause A: Reporting mechanisms changed.*
    *   *Clause B: New timeline for investigations.*
**Result:** Emily grasps the core changes instantly without the cognitive load of decoding complex sentence structures.

---

## �🏗️ System Architecture

High-level Microservices Architecture designed for scalability and minimal latency.

```mermaid
graph TD
    subgraph Frontend ["Accessible Frontend (React + Vite)"]
        UI[Accessibility Interface]
        Voice[Voice Processing Module]
        Bio[Biometric Capture]
    end

    subgraph Backend ["Intelligent Backend (FastAPI)"]
        API[API Gateway]
        Auth[Auth Service]
        Orch[AI Orchestrator]
    end

    subgraph AI_Layer ["Cognitive AI Services"]
        LLM[LLM Engine (GPT-4o/Claude)]
        Vision[Vision Service (Face ID)]
        RAG[RAG Vector Store (Pinecone)]
        STT[Whisper (Speech-to-Text)]
    end

    subgraph Data ["Secure Data Layer"]
        PG[(PostgreSQL - Users/Forms)]
        Vec[(Vector DB - Embeddings)]
    end

    %% Flows
    UI -->|HTTPS/WSS| API
    Bio -->|Image Data| API
    Voice -->|Audio Stream| STT
    
    API --> Auth
    API --> Orch
    
    Orch -->|Query| LLM
    Orch -->|Embeddings| RAG
    
    Auth --> PG
    RAG --> Vec
```

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI (Accessible Components).
- **Backend**: Python, FastAPI, Pydantic.
- **AI/ML**: OpenAI (GPT-4, Whisper), LangChain, Pinecone (Vector DB), MediaPipe (Vision).
- **Database**: PostgreSQL (Relational), Pinecone (Vector).

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker (Optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gkkv1/AccessAi.git
   cd AccessAi
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   # Create .env file with OPENAI_API_KEY, DATABASE_URL
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Portal**
   Open http://localhost:5173

---

## 🤝 Contributing
We believe in **Design for All**. Pull requests focusing on WCAG compliance and inclusive features are highly encouraged.

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for a more inclusive world.*
