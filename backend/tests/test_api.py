"""Run this once to seed demo data: python seed.py"""
import sys
sys.path.insert(0, ".")
 
from database import SessionLocal, engine, Base
from models import User, Doctor, Patient, UserRole
from services.auth_service import hash_password
 
Base.metadata.create_all(bind=engine)
db = SessionLocal()
 
doctors_data = [
    {"name": "Dr. Priya Sharma", "email": "priya@health.com", "spec": "Cardiologist", "qual": "MD, DM Cardiology", "exp": 12, "fee": 800.0, "bio": "Expert in interventional cardiology with 12+ years experience."},
    {"name": "Dr. Arjun Mehta", "email": "arjun@health.com", "spec": "Neurologist", "qual": "MD, DM Neurology", "exp": 8, "fee": 700.0, "bio": "Specializes in epilepsy, stroke and movement disorders."},
    {"name": "Dr. Kavya Nair", "email": "kavya@health.com", "spec": "Pediatrician", "qual": "MD Pediatrics", "exp": 6, "fee": 500.0, "bio": "Dedicated to child healthcare from newborn to adolescence."},
    {"name": "Dr. Ravi Kumar", "email": "ravi@health.com", "spec": "Orthopedic", "qual": "MS Orthopedics", "exp": 15, "fee": 900.0, "bio": "Joint replacement and sports injury specialist."},
    {"name": "Dr. Anita Patel", "email": "anita@health.com", "spec": "Dermatologist", "qual": "MD Dermatology", "exp": 9, "fee": 600.0, "bio": "Cosmetic and medical dermatology expert."},
]
 
patients_data = [
    {"name": "Rahul Verma", "email": "rahul@patient.com", "dob": "1990-05-15", "blood": "O+", "phone": "9876543210"},
    {"name": "Sneha Gupta", "email": "sneha@patient.com", "dob": "1995-08-22", "blood": "A+", "phone": "9876543211"},
    {"name": "Karthik Raj", "email": "karthik@patient.com", "dob": "1988-03-10", "blood": "B+", "phone": "9876543212"},
]
 
print("Seeding doctors...")
for d in doctors_data:
    if not db.query(User).filter(User.email == d["email"]).first():
        user = User(email=d["email"], full_name=d["name"], hashed_password=hash_password("Doctor@123"), role=UserRole.doctor)
        db.add(user); db.flush()
        doc = Doctor(user_id=user.id, specialization=d["spec"], qualification=d["qual"], experience_years=d["exp"], consultation_fee=d["fee"], bio=d["bio"], rating=4.5)
        db.add(doc)
        print(f"  ✓ {d['name']}")
 
print("Seeding patients...")
for p in patients_data:
    if not db.query(User).filter(User.email == p["email"]).first():
        user = User(email=p["email"], full_name=p["name"], hashed_password=hash_password("Patient@123"), role=UserRole.patient)
        db.add(user); db.flush()
        pat = Patient(user_id=user.id, date_of_birth=p["dob"], blood_group=p["blood"], phone=p["phone"])
        db.add(pat)
        print(f"  ✓ {p['name']}")
 
db.commit()
db.close()
print("\nSeed complete!")
print("Doctor login: priya@health.com / Doctor@123")
print("Patient login: rahul@patient.com / Patient@123")