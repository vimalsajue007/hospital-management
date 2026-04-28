import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from schemas import FileOut
from services.auth_service import get_current_user
from config import get_settings
import models
import logging
 
router = APIRouter(prefix="/api/files", tags=["Files"])
logger = logging.getLogger(__name__)
settings = get_settings()
 
ALLOWED_TYPES = {
    "application/pdf", "image/jpeg", "image/png", "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
 
 
@router.post("/upload/{patient_id}", response_model=FileOut, status_code=201)
async def upload_file(
    patient_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
 
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type not allowed: {file.content_type}")
 
    # Check file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit")
 
    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
 
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
 
    record = models.PatientFile(
        patient_id=patient_id,
        filename=unique_name,
        original_filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        content_type=file.content_type,
        description=description,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(f"File uploaded: {file.filename} for patient {patient_id}")
    return record
 
 
@router.get("/patient/{patient_id}", response_model=List[FileOut])
def list_patient_files(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    files = db.query(models.PatientFile).filter(models.PatientFile.patient_id == patient_id).all()
    return files
 
 
@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = db.query(models.PatientFile).filter(models.PatientFile.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")
 
    return FileResponse(
        path=record.file_path,
        filename=record.original_filename,
        media_type=record.content_type,
    )
 
 
@router.delete("/{file_id}", status_code=204)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = db.query(models.PatientFile).filter(models.PatientFile.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
 
    if os.path.exists(record.file_path):
        os.remove(record.file_path)
 
    db.delete(record)
    db.commit()