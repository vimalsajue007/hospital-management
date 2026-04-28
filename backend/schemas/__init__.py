from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, AppointmentStatus
 
 
# ── Auth Schemas ──────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str
 
 
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
 
 
# ── User Schemas ──────────────────────────────────────────────────
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.patient
 
 
class UserCreate(UserBase):
    password: str
 
 
class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
 
    class Config:
        from_attributes = True
 
 
# ── Doctor Schemas ────────────────────────────────────────────────
class DoctorBase(BaseModel):
    specialization: str
    qualification: str
    experience_years: int = 0
    consultation_fee: float = 0.0
    bio: Optional[str] = None
    phone: Optional[str] = None
    available_days: str = "Mon,Tue,Wed,Thu,Fri"
    available_time_start: str = "09:00"
    available_time_end: str = "17:00"
 
 
class DoctorCreate(DoctorBase):
    user: UserCreate
 
 
class DoctorUpdate(BaseModel):
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    available_days: Optional[str] = None
    available_time_start: Optional[str] = None
    available_time_end: Optional[str] = None
 
 
class DoctorOut(DoctorBase):
    id: int
    user_id: int
    rating: float
    created_at: datetime
    user: UserOut
 
    class Config:
        from_attributes = True
 
 
# ── Patient Schemas ───────────────────────────────────────────────
class PatientBase(BaseModel):
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None
 
 
class PatientCreate(PatientBase):
    user: UserCreate
 
 
class PatientUpdate(PatientBase):
    pass
 
 
class PatientOut(PatientBase):
    id: int
    user_id: int
    created_at: datetime
    user: UserOut
 
    class Config:
        from_attributes = True
 
 
# ── Appointment Schemas ───────────────────────────────────────────
class AppointmentBase(BaseModel):
    appointment_date: str
    appointment_time: str
    reason: Optional[str] = None
 
 
class AppointmentCreate(AppointmentBase):
    doctor_id: int
 
 
class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
 
 
class AppointmentOut(AppointmentBase):
    id: int
    doctor_id: int
    patient_id: int
    status: AppointmentStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    doctor: DoctorOut
    patient: PatientOut
 
    class Config:
        from_attributes = True
 
 
# ── File Schemas ──────────────────────────────────────────────────
class FileOut(BaseModel):
    id: int
    patient_id: int
    filename: str
    original_filename: str
    file_size: Optional[int]
    content_type: Optional[str]
    description: Optional[str]
    uploaded_at: datetime
 
    class Config:
        from_attributes = True
 
 
# ── Pagination ────────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list
 