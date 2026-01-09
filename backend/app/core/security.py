from datetime import datetime, timedelta
from typing import Optional, Any
# from passlib.context import CryptContext
# from jose import jwt
import json
import base64
from app.core.config import get_settings

settings = get_settings()

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Simple Mock Token: Base64 encoded JSON
    to_encode = {"exp": str(expire), "sub": str(subject)}
    # encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    json_str = json.dumps(to_encode)
    encoded_jwt = base64.b64encode(json_str.encode("utf-8")).decode("utf-8")
    return encoded_jwt

# MOCK SECURITY
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # return pwd_context.verify(plain_password, hashed_password)
    return hashed_password == f"fakehash_{plain_password}"

def get_password_hash(password: str) -> str:
    # return pwd_context.hash(password)
    return f"fakehash_{password}"
