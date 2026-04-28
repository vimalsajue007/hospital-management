from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from database import get_db
from schemas import PatientCreate, PatientOut, PatientUpdate, PaginatedResponse
from services.auth_service import hash_password, get_current_user, require_role
import models
import logging
import math
 
router = APIRouter(prefix="/api/patients", tags=["Patients"])
logger = logging.getLogger(__name__)
 
 
@router.post("/", response_model=PatientOut, status_code=201)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
 
    user = models.User(
        email=data.user.email,
        full_name=data.user.full_name,
        hashed_password=hash_password(data.user.password),
        role=models.UserRole.patient,
    )
    db.add(user)
    db.flush()
 
    patient = models.Patient(
        user_id=user.id,
        date_of_birth=data.date_of_birth,
        blood_group=data.blood_group,
        phone=data.phone,
        address=data.address,
        emergency_contact=data.emergency_contact,
        medical_history=data.medical_history,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    logger.info(f"Patient created: {user.full_name}")
    return patient
 
 
@router.get("/", response_model=PaginatedResponse)
def list_patients(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: Optional[str] = Query(None),
    blood_group: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Patient).join(models.User)
 
    if search:
        query = query.filter(
            or_(
                models.User.full_name.ilike(f"%{search}%"),
                models.User.email.ilike(f"%{search}%"),
                models.Patient.phone.ilike(f"%{search}%"),
            )
        )
    if blood_group:
        query = query.filter(models.Patient.blood_group == blood_group)
 
    total = query.count()
    patients = query.offset((page - 1) * page_size).limit(page_size).all()
 
    return PaginatedResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size),
        items=[PatientOut.model_validate(p) for p in patients],
    )
 
 
@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
 
 
@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
 
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(patient, field, value)
 
    db.commit()
    db.refresh(patient)
    return patient
 
 
@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.admin)),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()