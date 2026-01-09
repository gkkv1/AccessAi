from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid

from app.api import deps
from app.core import security, config
from app.models import models
from app.schemas import auth as schemas

router = APIRouter()
settings = config.get_settings()

@router.post("/register", response_model=schemas.UserResponse)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate
):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    if user_in.password != user_in.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=security.get_password_hash(user_in.password),
        disability_type=user_in.disability_type,
        accessibility_preferences=user_in.accessibility_preferences,
        biometric_registered=user_in.biometric_registered,
        face_id_registered=user_in.face_id_registered
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Mock Email Verification
    verification_token = str(uuid.uuid4())
    # In a real app, save this token to DB and send email
    print(f"--- MOCK EMAIL ---")
    print(f"To: {user.email}")
    print(f"Subject: Verify your email")
    print(f"Link: http://localhost:5173/verify-email?token={verification_token}")
    print(f"------------------")
    
    return user

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: schemas.UserLogin = Body(...) # Allow JSON body instead of Form data for accessibility/flexibility
):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    # Return user data with token for frontend state
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user
    }

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(
    current_user: models.User = Depends(deps.get_current_user),
):
    return current_user

@router.post("/verify-email")
def verify_email(token: str):
    # Mock implementation
    return {"success": True, "message": "Email verified successfully"}

@router.post("/forgot-password")
def forgot_password(email: schemas.EmailSchema):
    # Mock implementation
    print(f"--- MOCK EMAIL ---")
    print(f"To: {email.email}")
    print(f"Subject: Password Reset")
    print(f"Link: http://localhost:5173/reset-password?token=mock-reset-token")
    print(f"------------------")
    return {"success": True, "message": "Password reset email sent"}

@router.post("/reset-password")
def reset_password(data: schemas.PasswordResetConfirm):
    # Mock implementation
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    return {"success": True, "message": "Password has been reset successfully"}
