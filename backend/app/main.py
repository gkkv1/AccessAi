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

from app.db.session import engine
from app.models import models
# Create tables
# Create tables
# models.Base.metadata.create_all(bind=engine)

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
    "http://localhost:8080",  # Configured port
    "*"  # For hackathon demo purposes, allow all
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.api import api_router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to ACCESS.AI API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def seed_data():
    from app.db.mock_session import MockSession
    from app.models.models import User
    
    session = MockSession()
    # Check if we already have users (in case of hot reload persistence if implemented later)
    # For now, just add a default user
    
    # Needs to match mock security "fakehash_" prefix
    hashed_pwd = "fakehash_password123" 
    
    demo_user = User(
        email="demo@access.ai",
        full_name="Demo User",
        password_hash=hashed_pwd, 
        disability_type="dyslexia",
        is_active=True,
        email_verified=True,
        accessibility_preferences={"font_size": "medium"},
        biometric_registered=True,
        face_id_registered=True
    )
    
    session.add(demo_user)
    session.commit()
    print("--- MOCK DB SEEDED ---")
    print("User: demo@access.ai")
    print("Pass: password123")
    print("----------------------")
