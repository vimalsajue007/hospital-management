from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import Token, LoginRequest, UserCreate, UserOut
from services.auth_service import hash_password, verify_password, create_access_token
import models
import logging
 
router = APIRouter(prefix="/api/auth", tags=["Auth"])
logger = logging.getLogger(__name__)
 
 
@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        logger.warning(f"Failed login attempt for {data.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
 
    token = create_access_token({"sub": str(user.id), "role": user.role})
    logger.info(f"User {user.email} logged in successfully")
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )
 
 
@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
 
    user = models.User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"New user registered: {user.email} role={user.role}")
    return user