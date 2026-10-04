from typing import Dict, Tuple
from models.schemas import CategoryPercentages, CategoryCounts, GradingDetails
from models.grading_rules import GradingRules, default_grading_rules


def calculate_metrics_and_grade(
    counts: Dict[str, int],
    total_onions: int,
    rules: GradingRules = default_grading_rules
) -> Tuple[CategoryPercentages, float, float, GradingDetails]:
    """
    Computes percentage distribution, Grade A percentage, and URS percentage.
    
    Evaluates configurable agricultural grading criteria.
    NOTE: These rules are configurable thresholds rather than a statutory single global standard.
    """
    if total_onions == 0:
        empty_pct = CategoryPercentages(
            healthy=0.0,
            damaged=0.0,
            rotten=0.0,
            sprouted=0.0,
            undersized=0.0
        )
        grading = GradingDetails(
            overall_grade="URS",
            grade_a_percentage=0.0,
            urs_percentage=100.0,
            verdict_notes=["No onions detected in sample image."],
            is_acceptable=False
        )
        return empty_pct, 0.0, 100.0, grading

    # 1. Calculate percentage distribution
    h_pct = round((counts["healthy"] / total_onions) * 100.0, 1)
    d_pct = round((counts["damaged"] / total_onions) * 100.0, 1)
    r_pct = round((counts["rotten"] / total_onions) * 100.0, 1)
    s_pct = round((counts["sprouted"] / total_onions) * 100.0, 1)
    u_pct = round((counts["undersized"] / total_onions) * 100.0, 1)

    percentages = CategoryPercentages(
        healthy=h_pct,
        damaged=d_pct,
        rotten=r_pct,
        sprouted=s_pct,
        undersized=u_pct
    )

    # 2. Calculate Grade A percentage
    # In agricultural inspection, Grade A share represents the proportion of sound, defect-free bulbs
    grade_a = round(h_pct, 1)

    # 3. Calculate URS (Under Regular Standard / Reject) percentage
    # Sum of defective and undersized categories
    urs = round(d_pct + r_pct + s_pct + u_pct, 1)
    # Ensure mathematical balance to 100%
    if abs((grade_a + urs) - 100.0) <= 0.2:
        urs = round(100.0 - grade_a, 1)

    # 4. Evaluate against configurable grading criteria
    verdict_notes = []
    is_acceptable = True
    overall_grade = "Grade B"

    # Critical URS checks (Rotten threshold / severe defects)
    if r_pct > rules.urs_critical_rotten_pct:
        overall_grade = "URS"
        is_acceptable = False
        verdict_notes.append(
            f"REJECT (URS): Rotten percentage ({r_pct}%) exceeds critical limit of {rules.urs_critical_rotten_pct}%."
        )
    elif urs > rules.urs_critical_defect_sum_pct:
        overall_grade = "URS"
        is_acceptable = False
        verdict_notes.append(
            f"REJECT (URS): Cumulative defect rate ({urs}%) exceeds allowable tolerance of {rules.urs_critical_defect_sum_pct}%."
        )
    # Grade A checks
    elif (
        h_pct >= rules.grade_a_min_healthy_pct
        and r_pct <= rules.grade_a_max_rotten_pct
        and d_pct <= rules.grade_a_max_damaged_pct
        and s_pct <= rules.grade_a_max_sprouted_pct
        and u_pct <= rules.grade_a_max_undersized_pct
    ):
        overall_grade = "Grade A"
        verdict_notes.append(
            f"PASS: Healthy percentage ({h_pct}%) meets Grade A threshold (≥{rules.grade_a_min_healthy_pct}%)."
        )
        verdict_notes.append(
            f"All individual defect categories within Grade A tolerance limits."
        )
    else:
        overall_grade = "Grade B"
        verdict_notes.append(
            f"STANDARD COMMERCIAL (Grade B): Lot has {h_pct}% healthy onions. Below Grade A requirement of {rules.grade_a_min_healthy_pct}%."
        )

    grading = GradingDetails(
        overall_grade=overall_grade,
        grade_a_percentage=grade_a,
        urs_percentage=urs,
        verdict_notes=verdict_notes,
        is_acceptable=is_acceptable
    )

    return percentages, grade_a, urs, grading
