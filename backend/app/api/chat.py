from fastapi import APIRouter
from app.services.rag_service import rag_service
from app.schemas.document import SearchResult

router = APIRouter()

@router.get("/search", response_model=list[SearchResult])
async def search(q: str):
    return await rag_service.search(q)

@router.post("/simplify")
async def simplify(text: str):
    return {"simplified": await rag_service.simplify(text)}
