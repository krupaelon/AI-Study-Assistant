from typing import Any


def generate_recommendations(
    performance_data: dict[str, Any],
    target_role: str | None = None,
) -> dict[str, Any]:
    """
    Generate personalized recommendations from performance analytics.
    """

    category_summary = performance_data.get("category_summary", [])

    recommendations = []

    # Sort categories from weakest to strongest
    weakest_first = sorted(
        category_summary,
        key=lambda item: item.get("average_score", 0),
    )

    for item in weakest_first:
        category = item.get("category")
        score = item.get("average_score", 0)

        if category == "communication":
            if score < 60:
                priority = "High"
                action = "Practice communication and speaking exercises regularly."
            elif score < 75:
                priority = "High"
                action = "Improve communication through mock interview and speaking practice."
            else:
                priority = "Medium"
                action = "Continue practicing communication to maintain consistency."

        elif category == "interview":
            if score < 60:
                priority = "High"
                action = "Practice more mock interviews and improve technical explanations."
            elif score < 75:
                priority = "High"
                action = "Complete additional mock interviews and review weak answers."
            else:
                priority = "Medium"
                action = "Continue mock interviews to improve interview confidence."

        elif category == "quiz":
            if score < 60:
                priority = "High"
                action = "Revise weak academic topics and attempt more quizzes."
            elif score < 75:
                priority = "Medium"
                action = "Practice more quizzes and revise incorrect answers."
            else:
                priority = "Low"
                action = "Maintain regular quiz practice."

        elif category == "resume":
            if score < 60:
                priority = "High"
                action = "Improve resume structure, skills, keywords and ATS compatibility."
            elif score < 75:
                priority = "Medium"
                action = "Improve resume keywords and tailor it to target job descriptions."
            else:
                priority = "Low"
                action = "Keep the resume updated and tailor it to each job application."

        else:
            priority = "Medium"
            action = f"Continue improving your {category} performance."

        recommendations.append(
            {
                "category": category,
                "score": score,
                "priority": priority,
                "action": action,
            }
        )

    # Add career-specific recommendation
    if target_role:
        recommendations.append(
            {
                "category": "career",
                "score": None,
                "priority": "Medium",
                "action": (
                    f"Continue preparing for your target role as a "
                    f"{target_role}, by combining technical practice, "
                    f"projects and interview preparation."
                ),
            }
        )

    # Overall recommendation
    if weakest_first:
        weakest = weakest_first[0]

        overall_recommendation = (
            f"Your current priority should be improving "
            f"{weakest.get('category')} performance, "
            f"which has an average score of "
            f"{weakest.get('average_score')}."
        )
    else:
        overall_recommendation = (
            "Complete quizzes, interviews or communication assessments "
            "to generate personalized recommendations."
        )

    return {
        "overall_recommendation": overall_recommendation,
        "recommendations": recommendations,
    }