from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentBase(BaseModel):
    title: str  # Changed from 'name' to match ORM
    file_type: str  # Changed from 'type' to match ORM

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    status: str  # processing, ready, error
    created_at: datetime  # Changed from 'uploaded_at' to match ORM
    pages: Optional[int] = None
    summary: Optional[str] = None
    file_path: Optional[str] = None  # Changed from 'url' to match ORM
    content_text: Optional[str] = None  # Added content_text for Smart View

    class Config:
        from_attributes = True

class SearchResult(BaseModel):
    id: str
    document_id: str
    title: str
    snippet: str
    source: str
    page: Optional[int] = None
    relevance: float
