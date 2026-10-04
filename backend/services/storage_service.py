import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB limit


def validate_and_save_upload(file: UploadFile) -> str:
    """
    Validates uploaded image and temporarily saves to uploads directory.
    
    1. Validates filename extension.
    2. Validates MIME content type.
    3. Validates image integrity using PIL.
    4. Writes file to uploads directory with unique ID.
    
    Returns the absolute path to the saved file.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file missing filename.")

    # Check extension
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check Content-Type
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported media type '{file.content_type}'. Must be JPEG, PNG, or WebP."
        )

    # Generate unique filename
    unique_filename = f"batch_{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    # Verify image integrity with Pillow
    try:
        with Image.open(target_path) as img:
            img.verify()
    except Exception:
        # Remove corrupted file
        if os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid or readable image.")

    return target_path
