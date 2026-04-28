from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import AppointmentCreate, AppointmentOut, AppointmentUpdate, PaginatedResponse
from services.auth_service import get_current_user
from services.websocket_manager import manager
import models
import logging
import math
 
router = APIRouter(prefix="/api/appointments", tags=["Appointments"])
logger = logging.getLogger(__name__)
 
 
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat
            await websocket.send_text(f'{{"type":"pong","data":"{data}"}}')
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
 
 
@router.post("/", response_model=AppointmentOut, status_code=201)
async def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Get patient record
    patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=400, detail="Patient profile not found for current user")
 
    doctor = db.query(models.Doctor).filter(models.Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
 
    appointment = models.Appointment(
        doctor_id=data.doctor_id,
        patient_id=patient.id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        reason=data.reason,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
 
    logger.info(f"Appointment booked: patient={patient.id} doctor={doctor.id} date={data.appointment_date}")
 
    # Notify doctor via WebSocket
    await manager.send_to_user(doctor.user_id, {
        "type": "new_appointment",
        "message": f"New appointment booked by {current_user.full_name}",
        "appointment_id": appointment.id,
        "date": data.appointment_date,
        "time": data.appointment_time,
        "patient_name": current_user.full_name,
    })
 
    return appointment
 
 
@router.get("/", response_model=PaginatedResponse)
def list_appointments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status: Optional[str] = Query(None),
    doctor_id: Optional[int] = Query(None),
    patient_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Appointment)
 
    # Role-based filtering
    if current_user.role == models.UserRole.doctor:
        doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
        if doc:
            query = query.filter(models.Appointment.doctor_id == doc.id)
    elif current_user.role == models.UserRole.patient:
        pat = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
        if pat:
            query = query.filter(models.Appointment.patient_id == pat.id)
 
    if status:
        query = query.filter(models.Appointment.status == status)
    if doctor_id:
        query = query.filter(models.Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(models.Appointment.patient_id == patient_id)
 
    total = query.count()
    appointments = query.order_by(models.Appointment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
 
    return PaginatedResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size),
        items=[AppointmentOut.model_validate(a) for a in appointments],
    )
 
 
@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt
 
 
@router.put("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
 
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
 
    db.commit()
    db.refresh(appt)
 
    # Notify patient of status change
    if data.status:
        patient = db.query(models.Patient).filter(models.Patient.id == appt.patient_id).first()
        if patient:
            await manager.send_to_user(patient.user_id, {
                "type": "appointment_update",
                "message": f"Your appointment status changed to: {data.status}",
                "appointment_id": appointment_id,
                "status": data.status,
            })
 
    return appt
 
 
@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appt)
    db.commit()