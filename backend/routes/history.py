import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.connection import get_db
from database.models import AssessmentRecord
from models.schemas import (
    AssessmentItemResponse,
    CategoryCounts,
    CategoryPercentages,
)
from models.grading_rules import default_grading_rules, GradingRules

router = APIRouter()


def record_to_response(r: AssessmentRecord, base_url: str) -> AssessmentItemResponse:
    annotated_url = None
    if r.annotated_image_path and os.path.exists(r.annotated_image_path):
        annotated_url = f"{base_url}/uploads/{os.path.basename(r.annotated_image_path)}"

    raw_url = None
    if r.image_path and os.path.exists(r.image_path):
        raw_url = f"{base_url}/uploads/{os.path.basename(r.image_path)}"

    return AssessmentItemResponse(
        assessment_id=r.assessment_id,
        date=r.date.isoformat() if r.date else "",
        image_path=r.image_path,
        total_onions=r.total_onions,
        healthy_percentage=r.healthy_percentage,
        damaged_percentage=r.damaged_percentage,
        rotten_percentage=r.rotten_percentage,
        sprouted_percentage=r.sprouted_percentage,
        undersized_percentage=r.undersized_percentage,
        grade_a=r.grade_a,
        urs=r.urs,
        # Auxiliary attributes for UI
        batch_id=r.batch_id,
        variety=r.variety,
        notes=r.notes,
        overall_grade=r.overall_grade,
        counts=CategoryCounts(
            healthy=r.healthy_count,
            damaged=r.damaged_count,
            rotten=r.rotten_count,
            sprouted=r.sprouted_count,
            undersized=r.undersized_count,
        ),
        percentages=CategoryPercentages(
            healthy=r.healthy_percentage,
            damaged=r.damaged_percentage,
            rotten=r.rotten_percentage,
            sprouted=r.sprouted_percentage,
            undersized=r.undersized_percentage,
        ),
        annotated_image_url=annotated_url,
        raw_image_url=raw_url,
    )


@router.get("/assessments", response_model=List[AssessmentItemResponse])
def get_assessments(request: Request, db: Session = Depends(get_db)):
    """
    GET /assessments:
    Retrieves all past onion batch assessment records stored in SQLite.
    """
    records = db.query(AssessmentRecord).order_by(AssessmentRecord.date.desc()).all()
    base_url = str(request.base_url).rstrip("/")
    return [record_to_response(r, base_url) for r in records]


@router.get("/assessments/{assessment_id}", response_model=AssessmentItemResponse)
def get_assessment_by_id(assessment_id: str, request: Request, db: Session = Depends(get_db)):
    """
    GET /assessments/{id}:
    Retrieves a single assessment by its ID.
    """
    record = (
        db.query(AssessmentRecord)
        .filter(AssessmentRecord.assessment_id == assessment_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail=f"Assessment #{assessment_id} not found")

    base_url = str(request.base_url).rstrip("/")
    return record_to_response(record, base_url)


# Compatibility aliases for /history and /history/{id}
@router.get("/history", response_model=List[AssessmentItemResponse], include_in_schema=False)
def get_assessment_history(request: Request, db: Session = Depends(get_db)):
    return get_assessments(request, db)


@router.get("/history/{assessment_id}", response_model=AssessmentItemResponse, include_in_schema=False)
def get_history_by_id(assessment_id: str, request: Request, db: Session = Depends(get_db)):
    return get_assessment_by_id(assessment_id, request, db)


@router.get("/api/v1/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Returns aggregated statistics for the mobile dashboard."""
    total_assessments = db.query(AssessmentRecord).count()
    if total_assessments == 0:
        return {
            "total_assessments": 0,
            "total_onions_analyzed": 0,
            "average_grade_a": 0.0,
            "average_urs": 0.0,
        }

    total_onions = db.query(func.sum(AssessmentRecord.total_onions)).scalar() or 0
    avg_grade_a = db.query(func.avg(AssessmentRecord.grade_a)).scalar() or 0.0
    avg_urs = db.query(func.avg(AssessmentRecord.urs)).scalar() or 0.0

    return {
        "total_assessments": total_assessments,
        "total_onions_analyzed": total_onions,
        "average_grade_a": round(float(avg_grade_a), 1),
        "average_urs": round(float(avg_urs), 1),
    }


@router.get("/grading-rules", response_model=GradingRules)
def get_grading_rules():
    """Returns active configurable grading thresholds."""
    return default_grading_rules


@router.put("/grading-rules", response_model=GradingRules)
def update_grading_rules(updated_rules: GradingRules):
    """Updates active grading thresholds dynamically."""
    global default_grading_rules
    default_grading_rules = updated_rules
    return default_grading_rules
