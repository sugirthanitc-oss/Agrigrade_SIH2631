import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from .connection import Base


class AssessmentRecord(Base):
    __tablename__ = "assessments"

    # Requested Primary Fields
    assessment_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    image_path = Column(String, nullable=True)
    total_onions = Column(Integer, default=0)

    # Percentage Distributions
    healthy_percentage = Column(Float, default=0.0)
    damaged_percentage = Column(Float, default=0.0)
    rotten_percentage = Column(Float, default=0.0)
    sprouted_percentage = Column(Float, default=0.0)
    undersized_percentage = Column(Float, default=0.0)

    # Grading outputs
    grade_a = Column(Float, default=0.0)
    urs = Column(Float, default=0.0)

    # Auxiliary Fields for rich inspection metadata
    batch_id = Column(String, nullable=True, index=True)
    variety = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    overall_grade = Column(String, default="URS")

    # Counts
    healthy_count = Column(Integer, default=0)
    damaged_count = Column(Integer, default=0)
    rotten_count = Column(Integer, default=0)
    sprouted_count = Column(Integer, default=0)
    undersized_count = Column(Integer, default=0)

    # Images
    annotated_image_path = Column(String, nullable=True)

    # Backward-compatibility property aliases
    @property
    def id(self):
        return self.assessment_id

    @property
    def created_at(self):
        return self.date
