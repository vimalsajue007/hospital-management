from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from database import get_db
from schemas import DoctorCreate, DoctorOut, DoctorUpdate, PaginatedResponse
from services.auth_service import hash_password, get_current_user, require_role
import models
import logging
import math
 
router = APIRouter(prefix="/api/doctors", tags=["Doctors"])
logger = logging.getLogger(__name__)
 
 
def send_welcome_email(email: str, name: str):
    """Background task: simulate sending welcome email"""
    logger.info(f"[BG TASK] Welcome email sent to Dr. {name} at {email}")
 
 
@router.post("/", response_model=DoctorOut, status_code=201)
def create_doctor(
    data: DoctorCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if db.query(models.User).filter(models.User.email == data.user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
 
    user = models.User(
        email=data.user.email,
        full_name=data.user.full_name,
        hashed_password=hash_password(data.user.password),
        role=models.UserRole.doctor,
    )
    db.add(user)
    db.flush()
 
    doctor = models.Doctor(
        user_id=user.id,
        specialization=data.specialization,
        qualification=data.qualification,
        experience_years=data.experience_years,
        consultation_fee=data.consultation_fee,
        bio=data.bio,
        phone=data.phone,
        available_days=data.available_days,
        available_time_start=data.available_time_start,
        available_time_end=data.available_time_end,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
 
    background_tasks.add_task(send_welcome_email, user.email, user.full_name)
    logger.info(f"Doctor created: {user.full_name} ({data.specialization})")
    return doctor
 
 
@router.get("/", response_model=PaginatedResponse)
def list_doctors(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: Optional[str] = Query(None),
    specialization: Optional[str] = Query(None),
    min_fee: Optional[float] = Query(None),
    max_fee: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Doctor).join(models.User)
 
    if search:
        query = query.filter(
            or_(
                models.User.full_name.ilike(f"%{search}%"),
                models.Doctor.specialization.ilike(f"%{search}%"),
                models.Doctor.qualification.ilike(f"%{search}%"),
            )
        )
    if specialization:
        query = query.filter(models.Doctor.specialization.ilike(f"%{specialization}%"))
    if min_fee is not None:
        query = query.filter(models.Doctor.consultation_fee >= min_fee)
    if max_fee is not None:
        query = query.filter(models.Doctor.consultation_fee <= max_fee)
 
    total = query.count()
    doctors = query.offset((page - 1) * page_size).limit(page_size).all()
 
    return PaginatedResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size),
        items=[DoctorOut.model_validate(d) for d in doctors],
    )
 
 
@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor
 
 
@router.put("/{doctor_id}", response_model=DoctorOut)
def update_doctor(
    doctor_id: int,
    data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
 
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(doctor, field, value)
 
    db.commit()
    db.refresh(doctor)
    return doctor
 
 
@router.delete("/{doctor_id}", status_code=204)
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.admin)),
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()