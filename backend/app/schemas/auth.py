from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime
import uuid

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    disability_type: Optional[str] = None
    accessibility_preferences: Optional[Dict] = {}

class UserCreate(UserBase):
    password: str
    confirm_password: str
    biometric_registered: bool = False
    face_id_registered: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    email_verified: bool
    email_verified: bool
    created_at: datetime
    biometric_registered: bool = False
    face_id_registered: bool = False
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    id: Optional[str] = None

# Email/Password Schemas
class EmailSchema(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    password: str
    confirm_password: str

class UpdatePreferences(BaseModel):
    accessibility_preferences: Dict
