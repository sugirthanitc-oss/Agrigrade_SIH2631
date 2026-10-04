from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CategoryCounts(BaseModel):
    healthy: int = Field(default=0, description="Count of healthy onions")
    damaged: int = Field(default=0, description="Count of physically damaged onions")
    rotten: int = Field(default=0, description="Count of decayed/moldy onions")
    sprouted: int = Field(default=0, description="Count of sprouted onions")
    undersized: int = Field(default=0, description="Count of undersized onions")


class CategoryPercentages(BaseModel):
    healthy: float = Field(default=0.0, description="Percentage of healthy onions")
    damaged: float = Field(default=0.0, description="Percentage of physically damaged onions")
    rotten: float = Field(default=0.0, description="Percentage of decayed/moldy onions")
    sprouted: float = Field(default=0.0, description="Percentage of sprouted onions")
    undersized: float = Field(default=0.0, description="Percentage of undersized onions")


class DetectionItem(BaseModel):
    id: Optional[int] = None
    class_name: str = Field(..., alias="class", description="Class name: healthy, damaged, rotten, sprouted, undersized")
    confidence: float = Field(..., description="Detection confidence score [0.0 - 1.0]")
    bbox: List[float] = Field(..., description="Bounding box [x1, y1, x2, y2] in pixels")

    class Config:
        populate_by_name = True


class GradingDetails(BaseModel):
    overall_grade: str = Field(description="Assigned grade tier: Grade A, Grade B, or URS")
    grade_a_percentage: float = Field(description="Grade A share")
    urs_percentage: float = Field(description="URS / rejected share")
    verdict_notes: List[str] = Field(default_factory=list, description="Automated rule checks")
    is_acceptable: bool = Field(description="Commercial acceptance status")


class AnalyzeResponse(BaseModel):
    """
    Response schema for POST /analyze matching exact requirements:
    total_onions, detections, counts, percentages, grade_a, urs.
    """
    total_onions: int
    detections: Optional[List[DetectionItem]] = Field(default_factory=list)
    counts: CategoryCounts
    percentages: CategoryPercentages
    grade_a: float
    urs: float

    # Additional contextual metadata for mobile client & report generation
    assessment_id: Optional[str] = None
    batch_id: Optional[str] = None
    timestamp: Optional[str] = None
    annotated_image_url: Optional[str] = None
    raw_image_url: Optional[str] = None
    grading: Optional[GradingDetails] = None
    grading_rules_applied: Optional[Dict[str, Any]] = None
    image_quality_check: Optional[Dict[str, Any]] = None
    status_message: Optional[str] = None

    class Config:
        populate_by_name = True


class HealthResponse(BaseModel):
    status: str
    service: str
    yolo_model_loaded: bool
    yolo_model_path: str
    yolo_classes: Optional[Dict[int, str]] = None
    device: str
    timestamp: str
    active_grading_ruleset: str


class AssessmentItemResponse(BaseModel):
    """
    Requested schema for GET /assessments and GET /assessments/{id}
    """
    assessment_id: str
    date: str
    image_path: Optional[str] = None
    total_onions: int
    healthy_percentage: float
    damaged_percentage: float
    rotten_percentage: float
    sprouted_percentage: float
    undersized_percentage: float
    grade_a: float
    urs: float

    # Rich contextual fields for mobile app
    batch_id: Optional[str] = None
    variety: Optional[str] = None
    notes: Optional[str] = None
    overall_grade: Optional[str] = None
    counts: Optional[CategoryCounts] = None
    percentages: Optional[CategoryPercentages] = None
    detections: Optional[List[DetectionItem]] = None
    annotated_image_url: Optional[str] = None
    raw_image_url: Optional[str] = None


# Compatibility alias
HistoryItemResponse = AssessmentItemResponse
