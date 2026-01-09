from app.core.config import get_settings
from app.schemas.document import SearchResult

settings = get_settings()

class RagService:
    def __init__(self):
        # Initialize Pinecone/LangChain here
        pass

    async def search(self, query: str) -> list[SearchResult]:
        # Stub for RAG search
        print(f"Searching for: {query}")
        
        # Simulated Scenario: Parental Leave
        if "parental" in query.lower() or "leave" in query.lower():
            return [
                SearchResult(
                    id="doc_parental_1",
                    title="Parental Leave Policy - Section 3.2",
                    snippet="Full-time employees with 12+ months tenure are eligible for 6 months paid leave. This includes biological, adoptive, and foster parents. Leave can be taken continuously or intermittently within the first year.",
                    source="Parental Leave Policy.pdf",
                    page=5,
                    relevance=0.98
                ),
                SearchResult(
                    id="doc_medical_1",
                    title="Medical Leave Guidelines - Related Info",
                    snippet="Employee leave eligibility varies by employment type. Short-term disability may run concurrently with other leave types depending on state laws.",
                    source="Medical Leave Guidelines.pdf",
                    page=12,
                    relevance=0.75
                )
            ]
            
        # Default/Fallback Mock Result
        return [
            SearchResult(
                id="doc_default",
                title="General Policy Document",
                snippet=f"This is a search result for '{query}'. Please try searching for 'parental leave eligibility' to see the demo scenario.",
                source="General Policies.pdf",
                page=1,
                relevance=0.50
            )
        ]

    async def simplify(self, text: str) -> str:
        # Stub for text simplification
        print(f"Simplifying: {text[:50]}...")
        
        # Mock simplification for the demo scenario
        if "Full-time employees with 12+ months tenure" in text:
            return (
                "Simplified Summary:\n\n"
                "1. Eligibility: You need to work here for 1 year (full-time).\n"
                "2. Benefit: You get 6 months of paid leave.\n"
                "3. Who is covered: Moms, dads, adoptive parents, and foster parents.\n"
                "4. Flexibility: You can take time off all at once or in small chunks."
            )
            
        return f"SIMPLIFIED: {text} (This is a mock simplification. In production, this would use GPT-4 to rewrite the text in plain language.)"

rag_service = RagService()
