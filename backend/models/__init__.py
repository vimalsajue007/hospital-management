from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
 
 
class UserRole(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    patient = "patient"
 
 
class AppointmentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"
 
 
class User(Base):
    __tablename__ = "users"
 
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.patient)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    doctor = relationship("Doctor", back_populates="user", uselist=False)
    patient = relationship("Patient", back_populates="user", uselist=False)
 
 
class Doctor(Base):
    __tablename__ = "doctors"
 
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    specialization = Column(String, nullable=False)
    qualification = Column(String, nullable=False)
    experience_years = Column(Integer, default=0)
    consultation_fee = Column(Float, default=0.0)
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    available_days = Column(String, default="Mon,Tue,Wed,Thu,Fri")
    available_time_start = Column(String, default="09:00")
    available_time_end = Column(String, default="17:00")
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    user = relationship("User", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")
 
 
class Patient(Base):
    __tablename__ = "patients"
 
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    date_of_birth = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    user = relationship("User", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    files = relationship("PatientFile", back_populates="patient")
 
 
class Appointment(Base):
    __tablename__ = "appointments"
 
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    appointment_date = Column(String, nullable=False)
    appointment_time = Column(String, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.pending)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
 
    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
 
 
class PatientFile(Base):
    __tablename__ = "patient_files"
 
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    content_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
 
    patient = relationship("Patient", back_populates="files")