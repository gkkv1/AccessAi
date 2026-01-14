from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.models.models import Document as DocumentModel, AccessDocumentChunk
from app.schemas.document import SearchResult
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import uuid
import os

class RagService:
    def __init__(self):
        # Initialize OpenAI Embeddings (via OpenRouter if key starts with sk-or-)
        api_key = settings.OPENAI_API_KEY
        base_url = "https://openrouter.ai/api/v1" if api_key and api_key.startswith("sk-or-") else None
        
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=api_key,
            model="text-embedding-3-small",
            openai_api_base=base_url
        )
        self.llm = ChatOpenAI(
            openai_api_key=api_key,
            model_name=settings.LLM_MODEL, # Use configured model
            temperature=0,
            openai_api_base=base_url,
            max_tokens=1000 # Limit output to avoid credit errors
        )

    async def ingest_document(self, db: Session, doc_id: str):
        """
        Loads document, splits text, generates embeddings, and saves chunks to DB.
        """
        # 1. Fetch Document Metadata
        db_doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
        if not db_doc:
            print(f"Error: Document {doc_id} not found.")
            return

        print(f"Start Ingestion: {db_doc.title}")
        
        try:
            # 2. Load File
            if db_doc.file_type.lower() == "pdf":
                loader = PyPDFLoader(db_doc.file_path)
            else:
                loader = TextLoader(db_doc.file_path)
                
            raw_docs = loader.load()
            
            # 3. Split Text
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                add_start_index=True
            )
            chunks = text_splitter.split_documents(raw_docs)
            print(f"Generated {len(chunks)} chunks.")

            # 4. Generate Embeddings & Save Chunks
            for i, chunk in enumerate(chunks):
                # Calculate embedding vector
                vector = self.embeddings.embed_query(chunk.page_content)
                
                # Create Chunk Record
                db_chunk = AccessDocumentChunk(
                    document_id=doc_id,
                    chunk_index=i,
                    text_content=chunk.page_content,
                    embedding=vector,
                    page_number=chunk.metadata.get("page", 0) + 1 # PyPDF is 0-indexed
                )
                db.add(db_chunk)
            
            # Update Document Status and Content
            full_text = "\n\n".join([doc.page_content for doc in raw_docs])
            db_doc.content_text = full_text
            db_doc.status = "ready"
            db_doc.pages = len(raw_docs)
            db.commit()
            print(f"Ingestion Complete: {db_doc.title}")

        except Exception as e:
            print(f"Ingestion Failed: {e}")
            db_doc.status = "error"
            db.commit()

    async def search(self, db: Session, query: str, doc_id: str = None) -> list[SearchResult]:
        print(f"Searching for: {query} (Doc: {doc_id})")
        
        # 1. Embed Query
        query_vector = self.embeddings.embed_query(query)
        
        # 2. Vector Search
        # We need to select the Distance explicitly
        distance_col = AccessDocumentChunk.embedding.l2_distance(query_vector).label("distance")
        
        query_obj = db.query(AccessDocumentChunk, DocumentModel, distance_col).join(DocumentModel)
        
        if doc_id:
            query_obj = query_obj.filter(AccessDocumentChunk.document_id == doc_id)
            
        results = query_obj.order_by(distance_col).limit(5).all()

        search_results = []
        for chunk, doc, distance in results:
            # L2 Distance for normalized vectors: 0.0 (exact) to 2.0 (opposite)
            # Relevance = 1 - (distance / 2) ? Or use cosine approx?
            # Metric: Cosine Distance = L2^2 / 2
            # Similarity = 1 - Cosine Distance = 1 - (L2^2 / 2)
            
            # Clamp distance to avoid math errors if slightly > 2.0 due to float precision
            dist_val = float(distance)
            similarity = 1 - (dist_val * dist_val) / 2
            relevance = max(0.0, min(1.0, similarity))

            search_results.append(SearchResult(
                id=str(chunk.id),
                document_id=str(doc.id),
                title=doc.title,
                snippet=chunk.text_content,
                source=doc.title,
                page=chunk.page_number,
                relevance=relevance
            ))
            
        return search_results

    async def chat(self, db: Session, doc_id: str, query: str) -> str:
        """
        Context-aware chat with a specific document.
        """
        # 1. Retrieve Context
        results = await self.search(db, query, doc_id)
        context_text = "\n\n".join([f"[Page {r.page}] {r.snippet}" for r in results])
        
        if not results and len(query.split()) > 3:
             # Only generic answer if query is long enough to be meaningful but no context found
             pass

        # 2. System Prompt
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
        
        # 3. Chat Interaction
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Context:\n{context_text}\n\nQuestion: {query}")
        ]
        
        response = self.llm.invoke(messages)
        return response.content

    async def simplify(self, text: str) -> str:
        # Use GPT-4o to simplify text
        messages = [
            SystemMessage(content="You are an expert accessibility assistant. Rewrite the following text in Plain English (Grade 5 level). Use bullet points and simple headers."),
            HumanMessage(content=text)
        ]
        response = self.llm.invoke(messages)
        return response.content

rag_service = RagService()
