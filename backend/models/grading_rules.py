import os
from pydantic import BaseModel, Field


class GradingRules(BaseModel):
    """
    Configurable grading thresholds for agricultural batch quality assessment.
    
    NOTE: These rules are customizable parameters to suit regional agricultural
    agreements, cooperative standards (e.g. AGMARK, USDA, EU-UNECE), or buyer-specific
    tolerances, rather than an unchangeable single global standard.
    """
    ruleset_name: str = Field(
        default="Configurable Harvest Quality Baseline",
        description="Name or standard designation for this rule set"
    )
    description: str = Field(
        default="User-defined baseline thresholds for classifying batches into Grade A, Grade B, and URS (Under Regular Standard).",
        description="Detailed description of grading baseline rationale"
    )

    # Grade A Requirements
    grade_a_min_healthy_pct: float = Field(
        default=float(os.getenv("GRADE_A_MIN_HEALTHY_PCT", "70.0")),
        description="Minimum percentage of healthy onions required to achieve Grade A"
    )
    grade_a_max_rotten_pct: float = Field(
        default=float(os.getenv("GRADE_A_MAX_ROTTEN_PCT", "5.0")),
        description="Maximum permissible rotten percentage within a Grade A lot"
    )
    grade_a_max_damaged_pct: float = Field(
        default=float(os.getenv("GRADE_A_MAX_DAMAGED_PCT", "15.0")),
        description="Maximum permissible damaged percentage for Grade A"
    )
    grade_a_max_sprouted_pct: float = Field(
        default=float(os.getenv("GRADE_A_MAX_SPROUTED_PCT", "10.0")),
        description="Maximum permissible sprouted percentage for Grade A"
    )
    grade_a_max_undersized_pct: float = Field(
        default=float(os.getenv("GRADE_A_MAX_UNDERSIZED_PCT", "15.0")),
        description="Maximum permissible undersized percentage for Grade A"
    )

    # URS (Under Regular Standard / Reject) Thresholds
    urs_critical_rotten_pct: float = Field(
        default=float(os.getenv("URS_CRITICAL_ROTTEN_PCT", "8.0")),
        description="Rotten percentage that immediately flags batch as URS"
    )
    urs_critical_defect_sum_pct: float = Field(
        default=30.0,
        description="Cumulative defect percentage (damaged + rotten + sprouted + undersized) triggering URS designation"
    )


# Active default configuration instance
default_grading_rules = GradingRules()
