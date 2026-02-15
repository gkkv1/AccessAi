from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="ACCESS.AI API",
    description="Backend for Intelligent Accessible Document Portal",
    version="1.0.0"
)

# Database initialization moved to init_db.py script
# This prevents pgvector extension errors on startup
# Run: python init_db.py before starting the server
from app.db.session import engine
from app.models import models

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://access-ai-two.vercel.app",  # Explicitly allow Vercel
    "*"  # Fallback
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"Global Error: {str(exc)}\n{traceback.format_exc()}"
    print(error_msg)
    with open("api_error.txt", "w") as f:
        f.write(error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Check api_error.txt"},
    )

from app.api.api import api_router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to ACCESS.AI API", "status": "running"}

from fastapi.staticfiles import StaticFiles

# Mount uploads directory for static access (e.g. PDF viewer)
# Ensure directory exists or this will fail
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_db():
    print("--- ACCESS.AI BACKEND STARTED ---")
    print("Database: Connected")
    print("---------------------------------")
