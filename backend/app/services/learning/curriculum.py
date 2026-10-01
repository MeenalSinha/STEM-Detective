"""
NGSS / Common Core curriculum standards mapper.
Tags every mystery interaction to real education standards.
This is what makes STEM Detective sellable to schools and fundable.
"""
from typing import List

# Next Generation Science Standards (NGSS) mapping
NGSS_STANDARDS = {
    "biology": {
        "photosynthesis": ["LS1-5", "LS1-6", "LS2-5"],
        "ecosystems": ["LS2-1", "LS2-2", "LS2-3", "LS2-4"],
        "genetics": ["LS3-1", "LS3-2", "LS3-3"],
        "evolution": ["LS4-1", "LS4-2", "LS4-3", "LS4-4"],
        "cells": ["LS1-1", "LS1-2"],
        "food chains": ["LS2-1", "LS2-2"],
        "disease": ["LS1-1", "LS2-2"],
        "DNA": ["LS3-1", "LS3-2"],
    },
    "chemistry": {
        "chemical reactions": ["PS1-1", "PS1-2", "PS1-5"],
        "acids and bases": ["PS1-1", "PS1-2"],
        "matter": ["PS1-1", "PS1-3", "PS1-4"],
        "solutions": ["PS1-1", "PS1-2"],
        "water quality": ["ESS3-3", "PS1-1"],
        "compounds": ["PS1-1", "PS1-2"],
        "pH": ["PS1-1", "PS1-2"],
    },
    "physics": {
        "forces": ["PS2-1", "PS2-2", "PS2-3"],
        "motion": ["PS2-1", "PS2-2"],
        "energy": ["PS3-1", "PS3-2", "PS3-3", "PS3-4"],
        "waves": ["PS4-1", "PS4-2"],
        "gravity": ["PS2-4", "ESS1-1", "ESS1-2"],
        "orbital mechanics": ["ESS1-1", "ESS1-2", "PS2-4"],
        "Newton's laws": ["PS2-1", "PS2-2"],
    },
    "environmental": {
        "pollution": ["ESS3-1", "ESS3-3", "ESS3-4"],
        "climate": ["ESS2-4", "ESS2-5", "ESS3-5"],
        "ecosystems": ["LS2-1", "LS2-4", "LS2-7"],
        "water cycle": ["ESS2-4", "ESS2-5"],
        "biodiversity": ["LS2-2", "LS4-5", "LS4-6"],
        "renewable energy": ["ESS3-1", "ESS3-2", "ESS3-3"],
        "human impact": ["ESS3-1", "ESS3-3", "ESS3-4", "ESS3-6"],
    },
    "mathematics": {
        "statistics": ["SP-1", "SP-2", "SP-3"],
        "probability": ["SP-6", "SP-7", "SP-8"],
        "algebra": ["A-REI-1", "A-REI-2"],
        "geometry": ["G-CO-1", "G-CO-2"],
        "cryptography": ["A-SSE-1", "A-SSE-2"],
        "data analysis": ["SP-1", "SP-2", "SP-3", "SP-4"],
    },
    "engineering": {
        "structural engineering": ["ETS1-1", "ETS1-2", "ETS1-3"],
        "design": ["ETS1-1", "ETS1-2"],
        "systems": ["ETS1-3", "ETS1-4"],
        "robotics": ["ETS1-1", "ETS1-2", "PS2-1"],
        "bridge": ["ETS1-1", "ETS1-2", "PS2-1", "PS2-2"],
    },
}

# Common Core Math Standards (abbreviated)
CCSS_STANDARDS = {
    "mathematics": {
        "statistics": ["CCSS.MATH.6.SP.A.1", "CCSS.MATH.6.SP.B.4"],
        "algebra": ["CCSS.MATH.8.EE.A.1", "CCSS.MATH.8.EE.C.7"],
        "probability": ["CCSS.MATH.7.SP.C.5", "CCSS.MATH.7.SP.C.6"],
        "data analysis": ["CCSS.MATH.6.SP.A.1", "CCSS.MATH.6.SP.B.5"],
    }
}

# Full NGSS descriptions for teacher dashboard display
NGSS_DESCRIPTIONS = {
    "LS1-5": "Construct a scientific explanation based on evidence for how environmental and genetic factors influence the growth of organisms.",
    "LS1-6": "Construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter and flow of energy.",
    "LS2-1": "Analyze and interpret data to provide evidence for the effects of resource availability on organisms and populations.",
    "LS2-2": "Construct an explanation that predicts patterns of interactions among organisms across multiple ecosystems.",
    "ESS3-3": "Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment.",
    "PS1-1": "Use the periodic table as a model to predict the relative properties of elements.",
    "PS1-2": "Construct and revise an explanation for the outcome of a simple chemical reaction.",
    "PS2-1": "Analyze data to support the claim that Newton's second law of motion describes the mathematical relationship among force, mass, and acceleration.",
    "PS2-4": "Construct an explanation of the gravitational force exerted by Earth on objects at Earth's surface.",
    "ESS1-1": "Develop a model based on evidence to illustrate the life span of the sun and the role of nuclear fusion in the sun's core.",
    "ETS1-1": "Analyze a major global challenge to specify qualitative and quantitative criteria and constraints for solutions.",
    "ETS1-2": "Design a solution to a complex real-world problem by breaking it down into smaller, more manageable problems.",
}


def map_topic_to_standards(subject: str, topic: str, stem_concepts: list) -> dict:
    """
    Map a mystery topic and STEM concepts to curriculum standards.
    Returns NGSS and CCSS standards with descriptions.
    """
    subject_lower = subject.lower()
    topic_lower = topic.lower()

    standards = set()

    # Direct topic match
    subject_map = NGSS_STANDARDS.get(subject_lower, {})
    for key, stds in subject_map.items():
        if key in topic_lower or topic_lower in key:
            standards.update(stds)

    # Concept-level matching
    for concept in stem_concepts:
        concept_lower = concept.lower()
        for key, stds in subject_map.items():
            if key in concept_lower or concept_lower in key:
                standards.update(stds)

    # CCSS for math
    ccss = set()
    if subject_lower == "mathematics":
        math_map = CCSS_STANDARDS.get("mathematics", {})
        for key, stds in math_map.items():
            if key in topic_lower:
                ccss.update(stds)

    standards_list = sorted(list(standards))

    return {
        "ngss_standards": standards_list,
        "ccss_standards": sorted(list(ccss)),
        "standard_descriptions": {
            std: NGSS_DESCRIPTIONS.get(std, f"NGSS Standard {std}")
            for std in standards_list
            if std in NGSS_DESCRIPTIONS
        },
        "standards_count": len(standards_list) + len(ccss),
        "grade_band": _get_grade_band(subject_lower, topic_lower),
    }


def _get_grade_band(subject: str, topic: str) -> str:
    """Determine NGSS grade band for the topic."""
    advanced_topics = [
        "orbital", "genetics", "evolution", "cryptography",
        "structural", "thermodynamics", "quantum",
    ]
    middle_topics = [
        "photosynthesis", "chemical reactions", "forces", "motion",
        "ecosystems", "probability", "statistics", "acids",
    ]
    topic_lower = topic.lower()
    if any(t in topic_lower for t in advanced_topics):
        return "9-12"
    if any(t in topic_lower for t in middle_topics):
        return "6-8"
    return "3-5"


def generate_teacher_standards_report(cases: list) -> dict:
    """
    Generate a standards coverage report for teacher dashboard.
    Shows which NGSS standards were addressed across all cases in a classroom.
    """
    all_standards = {}
    for case in cases:
        subject = case.get("subject", "biology")
        topic = case.get("topic", "")
        concepts = case.get("stem_concepts", [])
        standards = map_topic_to_standards(subject, topic, concepts)

        for std in standards.get("ngss_standards", []):
            if std not in all_standards:
                all_standards[std] = {
                    "standard": std,
                    "description": NGSS_DESCRIPTIONS.get(std, f"NGSS {std}"),
                    "cases_covered": 0,
                    "subjects": set(),
                }
            all_standards[std]["cases_covered"] += 1
            all_standards[std]["subjects"].add(subject)

    # Convert sets to lists for JSON serialization
    for std_data in all_standards.values():
        std_data["subjects"] = list(std_data["subjects"])

    return {
        "total_standards_covered": len(all_standards),
        "standards": list(all_standards.values()),
        "coverage_summary": f"{len(all_standards)} NGSS standards addressed across {len(cases)} mysteries",
    }
