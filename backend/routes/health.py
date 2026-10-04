from datetime import datetime
from fastapi import APIRouter
import torch

from models.schemas import HealthResponse
from models.grading_rules import default_grading_rules
from services.yolo_service import yolo_engine

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint to test whether the backend is running
    and inspect YOLO model and hardware status.
    """
    device_info = "cuda" if torch.cuda.is_available() else "cpu"
    if torch.cuda.is_available():
        device_info += f" ({torch.cuda.get_device_name(0)})"

    return HealthResponse(
        status="healthy",
        service="Onion Quality AI - Computer Vision Backend",
        yolo_model_loaded=yolo_engine.is_loaded(),
        yolo_model_path=yolo_engine.get_model_path(),
        yolo_classes=yolo_engine.get_class_names() if yolo_engine.is_loaded() else None,
        device=device_info,
        timestamp=datetime.utcnow().isoformat(),
        active_grading_ruleset=default_grading_rules.ruleset_name,
    )
