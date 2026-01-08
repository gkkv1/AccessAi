from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentBase(BaseModel):
    name: str
    type: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    status: str  # processing, ready, error
    uploaded_at: datetime
    pages: Optional[int] = None
    summary: Optional[str] = None
    url: Optional[str] = None

    class Config:
        from_attributes = True

class SearchResult(BaseModel):
    id: str
    title: str
    snippet: str
    source: str
    page: Optional[int] = None
    relevance: float
