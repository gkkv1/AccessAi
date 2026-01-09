from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
# from jose import jwt, JWTError
# from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core import config, security
from app.models import models
from app.schemas import auth
import json
import base64

settings = config.get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    try:
        # db = SessionLocal()
        # yield db
        from app.db.mock_session import MockSession
        db = MockSession()
        yield db
    finally:
        db.close()

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> models.User:
    try:
        # payload = jwt.decode(
        #     token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        # )
        # MOCK DECODE
        decoded_bytes = base64.b64decode(token)
        decoded_str = decoded_bytes.decode("utf-8")
        payload = json.loads(decoded_str)
        
        token_data = auth.TokenData(id=payload.get("sub"))
    except Exception: # (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user = db.query(models.User).filter(models.User.id == token_data.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user
