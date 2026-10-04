import os
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import AssessmentRecord
from models.schemas import AnalyzeResponse, CategoryCounts, DetectionItem
from models.grading_rules import default_grading_rules
from services.storage_service import validate_and_save_upload
from services.yolo_service import yolo_engine
from services.grading_service import calculate_metrics_and_grade

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_onion_batch(
    request: Request,
    file: UploadFile = File(..., description="Uploaded onion batch image"),
    batch_id: Optional[str] = Form(None, description="Optional batch / lot identifier"),
    variety: Optional[str] = Form(None, description="Onion variety"),
    notes: Optional[str] = Form(None, description="Inspection notes"),
    db: Session = Depends(get_db),
):
    """
    Core AI Assessment Pipeline:
    1. Accept an uploaded image.
    2. Validate file and save in uploads/.
    3. Evaluate image quality (brightness, blur, resolution).
    4. Run YOLO object detection.
    5. Count individual onions across 5 categories: healthy, damaged, rotten, sprouted, undersized.
    6. Calculate percentages, Grade A, and URS with configurable rules.
    7. Return detailed detections with bounding boxes.
    """
    # 1. Validate & save image upload
    saved_image_path = validate_and_save_upload(file)

    # 2. Run real YOLO detection inference
    counts_dict, total_onions, annotated_path, raw_detections, quality_check, status_message = yolo_engine.run_inference(
        image_path=saved_image_path
    )

    # Format detections list
    formatted_detections: List[DetectionItem] = []
    for d in raw_detections:
        formatted_detections.append(DetectionItem(
            id=d.get("id"),
            class_name=d.get("class", d.get("class_name", "healthy")),
            confidence=d.get("confidence", 0.0),
            bbox=d.get("bbox", [])
        ))

    counts_model = CategoryCounts(
        healthy=counts_dict["healthy"],
        damaged=counts_dict["damaged"],
        rotten=counts_dict["rotten"],
        sprouted=counts_dict["sprouted"],
        undersized=counts_dict["undersized"],
    )

    # 3. Calculate percentages and grade
    if total_onions > 0:
        percentages, grade_a, urs, grading_details = calculate_metrics_and_grade(
            counts=counts_dict,
            total_onions=total_onions,
            rules=default_grading_rules
        )
    else:
        from models.schemas import CategoryPercentages, GradingDetails
        percentages = CategoryPercentages(healthy=0.0, damaged=0.0, rotten=0.0, sprouted=0.0, undersized=0.0)
        grade_a = 0.0
        urs = 0.0
        grading_details = GradingDetails(
            overall_grade="Unassessed",
            grade_a_percentage=0.0,
            urs_percentage=0.0,
            verdict_notes=["No onions detected in the camera frame. Reposition onions and retry."],
            is_acceptable=False
        )

    # Generate public URLs for images
    base_url = str(request.base_url).rstrip("/")
    annotated_filename = os.path.basename(annotated_path)
    raw_filename = os.path.basename(saved_image_path)
    annotated_url = f"{base_url}/uploads/{annotated_filename}" if annotated_path else None
    raw_url = f"{base_url}/uploads/{raw_filename}"

    assessment_id = str(uuid.uuid4())
    resolved_batch_id = batch_id or f"BATCH-{datetime.utcnow().strftime('%Y%m%d')}-{assessment_id[:6].upper()}"

    # 4. Persist assessment record into SQLite database
    now = datetime.utcnow()
    try:
        record = AssessmentRecord(
            assessment_id=assessment_id,
            date=now,
            image_path=saved_image_path,
            total_onions=total_onions,
            healthy_percentage=percentages.healthy,
            damaged_percentage=percentages.damaged,
            rotten_percentage=percentages.rotten,
            sprouted_percentage=percentages.sprouted,
            undersized_percentage=percentages.undersized,
            grade_a=grade_a,
            urs=urs,
            batch_id=resolved_batch_id,
            variety=variety,
            notes=notes,
            overall_grade=grading_details.overall_grade,
            healthy_count=counts_model.healthy,
            damaged_count=counts_model.damaged,
            rotten_count=counts_model.rotten,
            sprouted_count=counts_model.sprouted,
            undersized_count=counts_model.undersized,
            annotated_image_path=annotated_path,
        )
        db.add(record)
        db.commit()
    except Exception as e:
        print(f"[Warning] Failed to persist assessment record to SQLite: {e}")
        db.rollback()

    # 5. Return JSON containing required fields & metadata
    return AnalyzeResponse(
        total_onions=total_onions,
        detections=formatted_detections,
        counts=counts_model,
        percentages=percentages,
        grade_a=grade_a,
        urs=urs,
        assessment_id=assessment_id,
        batch_id=resolved_batch_id,
        timestamp=datetime.utcnow().isoformat(),
        annotated_image_url=annotated_url,
        raw_image_url=raw_url,
        grading=grading_details,
        grading_rules_applied={
            "ruleset": default_grading_rules.ruleset_name,
            "min_healthy_pct": default_grading_rules.grade_a_min_healthy_pct,
            "critical_rotten_pct": default_grading_rules.urs_critical_rotten_pct,
            "note": "Configurable prototype ruleset"
        },
        image_quality_check=quality_check,
        status_message=status_message
    )
