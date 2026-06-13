"""
STEM Detective AI Service
Primary: Google Gemini 2.0 Flash
Fallback: OpenAI GPT-4o (if OPENAI_API_KEY set)
"""
import json
import re
from typing import Optional, AsyncGenerator
from app.core.config import settings

# ── Gemini Client (Primary) ────────────────────────────────────────────────────

_gemini_client = None


def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        try:
            import google.generativeai as genai
            api_key = settings.GEMINI_API_KEY
            if not api_key or api_key in ("your-gemini-api-key", "test-key", ""):
                return None
            genai.configure(api_key=api_key)
            _gemini_client = genai.GenerativeModel(
                "gemini-2.0-flash",
                generation_config={"response_mime_type": "application/json"},
            )
        except ImportError:
            pass
    return _gemini_client


# ── OpenAI Client (Fallback) ───────────────────────────────────────────────────

_openai_client = None


def get_openai_client():
    global _openai_client
    if _openai_client is None:
        try:
            import openai
            api_key = settings.OPENAI_API_KEY
            if not api_key or api_key in ("sk-your-openai-key", "sk-test-key", ""):
                return None
            _openai_client = openai.AsyncOpenAI(api_key=api_key)
        except ImportError:
            pass
    return _openai_client


# ── Core AI Caller ─────────────────────────────────────────────────────────────

async def _call_ai(prompt: str, system: str) -> str:
    """Call AI: Gemini primary, OpenAI fallback."""
    full_prompt = f"{system}\n\n{prompt}\n\nRespond with valid JSON only. No markdown fences."

    # Try Gemini first
    gem = get_gemini_client()
    if gem:
        try:
            resp = gem.generate_content(full_prompt)
            text = resp.text.strip()
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'```\s*$', '', text)
            return text
        except Exception as gem_err:
            print(f"[Gemini error] {gem_err}")

    # Fallback to OpenAI
    oai = get_openai_client()
    if oai:
        try:
            resp = await oai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=4096,
                temperature=0.8,
            )
            return resp.choices[0].message.content or "{}"
        except Exception as oai_err:
            print(f"[OpenAI error] {oai_err}")

    # No AI available — return a graceful demo response
    return json.dumps(_demo_mystery_response())


def _demo_mystery_response() -> dict:
    """Return a demo mystery when no AI key is configured."""
    return {
        "title": "The Greenhouse Crisis",
        "tagline": "Plants are dying across the city — can you uncover why?",
        "story": (
            "It began on a Tuesday morning. Across Verdantville, greenhouse owners discovered their "
            "plants wilting overnight. Leaves yellowed, stems drooped, and fruit rotted on the vine. "
            "The city's food supply is threatened. As a STEM Detective, you must investigate the "
            "environmental conditions, analyze water and soil samples, and interview witnesses to "
            "uncover the hidden culprit before the entire harvest is lost."
        ),
        "setting": "Verdantville urban greenhouse district",
        "characters": [
            {
                "name": "Rosa Chen",
                "role": "witness",
                "description": "A veteran botanist with 30 years experience",
                "dialogue_style": "Technical but warm",
                "knowledge": ["photosynthesis", "plant biology", "soil chemistry"],
                "initial_statement": "I've never seen anything like this. The chlorophyll is breaking down, but I can't pinpoint why.",
            }
        ],
        "clues": [
            {
                "id": "clue_1",
                "title": "Yellowing Leaves",
                "description": "The leaves show chlorosis — a yellowing that indicates lack of chlorophyll production.",
                "clue_type": "physical",
                "stem_concept": "Photosynthesis & Chlorophyll",
                "scientific_explanation": "Chlorosis occurs when plants cannot produce enough chlorophyll, often due to nutrient deficiency or light deprivation.",
                "unlock_condition": "Inspect the plants",
            },
            {
                "id": "clue_2",
                "title": "Acidic Water pH",
                "description": "The irrigation water tests at pH 4.2 — far too acidic for most plants.",
                "clue_type": "laboratory",
                "stem_concept": "pH and Acidity",
                "scientific_explanation": "Most plants thrive at pH 6.0-7.0. Acidic water disrupts nutrient uptake pathways.",
                "unlock_condition": "Test the water supply",
            },
        ],
        "stem_concepts": ["Photosynthesis", "pH Chemistry", "Plant Biology", "Environmental Science"],
        "investigation_path": [
            "Step 1: Observe plant symptoms",
            "Step 2: Test water and soil pH",
            "Step 3: Analyze light exposure levels",
            "Step 4: Interview greenhouse workers",
            "Step 5: Form hypothesis about the cause",
            "Step 6: Run lab experiments to confirm",
        ],
        "lab_challenges": [
            {
                "lab_type": "chemistry",
                "name": "Water pH Analysis",
                "hypothesis_hint": "Test whether the irrigation water is too acidic",
                "expected_finding": "pH below 6.0 indicates contamination",
            }
        ],
        "solution": (
            "Industrial runoff from a nearby factory raised the acidity of the groundwater supply "
            "(pH 4.2). This disrupted the plants' ability to absorb nitrogen and other nutrients, "
            "halting chlorophyll synthesis and causing widespread chlorosis. The solution is to "
            "neutralize the water supply and identify the source of acid contamination."
        ),
        "key_stem_insight": "Photosynthesis requires specific pH conditions to allow nutrient uptake. Environmental pollution can disrupt entire ecosystems through pH imbalance.",
        "world_state": {
            "severity": "high",
            "time_elapsed": "0 hours",
            "environment_status": "Plants wilting across the greenhouse district",
            "affected_entities": ["Greenhouse crops", "Local food supply", "Ecosystem"],
            "escalation_events": [
                {
                    "trigger": "If student ignores water testing for 5 actions",
                    "event": "More plants die, spread widens",
                    "new_evidence": "Dead fish found in nearby pond",
                }
            ],
        },
        "thumbnail_description": "A wilting greenhouse with yellow plants under dim lights",
    }


# ── System Prompts ─────────────────────────────────────────────────────────────

MYSTERY_SYSTEM_PROMPT = """You are the STEM Detective Mystery Generator, an expert educational game designer 
and science educator. You create immersive detective mysteries that teach real STEM concepts.

Your mysteries must:
1. Be scientifically accurate and curriculum-aligned
2. Have engaging narrative with realistic characters
3. Include multiple STEM challenges appropriate for the grade level
4. Have a logical investigation path leading to a scientific conclusion
5. Make students apply STEM concepts to solve the mystery

Always respond with valid JSON only, no markdown fences."""

DUNGEON_MASTER_SYSTEM = """You are the AI Dungeon Master for STEM Detective, an educational mystery game.
You control the living world of the mystery investigation.

Your responsibilities:
- Describe what students discover when they investigate
- Create new clues based on student actions
- Keep the story engaging and scientifically accurate  
- Introduce plot twists that reinforce STEM learning
- Never give away answers directly; guide through discovery
- Adapt difficulty based on student progress

Respond with valid JSON only."""


# ── Main AI Functions ──────────────────────────────────────────────────────────

async def generate_mystery(
    subject: str,
    grade_level: str,
    difficulty: str,
    topic: str,
    additional_context: Optional[str] = None,
) -> dict:
    """Generate a complete AI mystery for a given STEM topic."""

    difficulty_guide = {
        "easy": "Use simple vocabulary, basic concepts, 3-4 clues",
        "medium": "Moderate complexity, 5-6 clues, some calculations required",
        "hard": "Advanced concepts, 7-8 clues, multi-step reasoning",
        "expert": "Complex systems thinking, 8+ clues, research-level understanding",
    }

    prompt = f"""Generate a complete STEM detective mystery with these parameters:

Subject: {subject}
Grade Level: {grade_level}  
Difficulty: {difficulty} ({difficulty_guide.get(difficulty, '')})
Topic: {topic}
{f'Additional Context: {additional_context}' if additional_context else ''}

Return a JSON object with this exact structure:
{{
  "title": "Mystery title (intriguing, 3-6 words)",
  "tagline": "One sentence hook",
  "story": "Full story introduction (200-300 words). Set the scene dramatically.",
  "setting": "Location/environment description",
  "characters": [
    {{
      "name": "Character name",
      "role": "Their role (witness/expert/suspect/victim)",
      "description": "Physical and personality description",
      "dialogue_style": "How they speak",
      "knowledge": ["STEM knowledge they hold"],
      "initial_statement": "What they say when first met"
    }}
  ],
  "clues": [
    {{
      "id": "clue_1",
      "title": "Clue title",
      "description": "What the student finds",
      "clue_type": "physical/data/witness/laboratory",
      "stem_concept": "The STEM concept this clue teaches",
      "scientific_explanation": "The real science behind this clue",
      "unlock_condition": "How to find this clue"
    }}
  ],
  "stem_concepts": ["List of STEM concepts students will learn"],
  "investigation_path": [
    "Step 1: Initial observation",
    "Step 2: ...",
    "Step N: Final deduction"
  ],
  "lab_challenges": [
    {{
      "lab_type": "chemistry/biology/physics/environmental",
      "name": "Experiment name",
      "hypothesis_hint": "What to test",
      "expected_finding": "What correct results show"
    }}
  ],
  "solution": "Complete scientific explanation of the mystery (100-150 words)",
  "key_stem_insight": "The core STEM lesson students should take away",
  "world_state": {{
    "severity": "low/medium/high/critical",
    "time_elapsed": "0 hours",
    "environment_status": "Initial state description",
    "affected_entities": ["What/who is affected"],
    "escalation_events": [
      {{
        "trigger": "If student ignores X for Y actions",
        "event": "What worsens",
        "new_evidence": "New clue that appears"
      }}
    ]
  }},
  "thumbnail_description": "Visual scene description for illustration"
}}"""

    raw = await _call_ai(prompt, MYSTERY_SYSTEM_PROMPT)
    return json.loads(raw)


async def dungeon_master_response(
    case_data: dict,
    student_message: str,
    action_type: str,
    conversation_history: list,
) -> dict:
    """Generate AI Dungeon Master narrative response."""

    context = f"""Current Mystery: {case_data['title']}
Topic: {case_data.get('topic', '')}
Subject: {case_data.get('subject', '')}
World State: {json.dumps(case_data.get('world_state', {}), indent=2)}
Revealed Clues: {[c['title'] for c in case_data.get('clues', []) if c.get('is_revealed')]}
Progress: {case_data.get('progress_percentage', 0)}%"""

    history_text = ""
    for msg in conversation_history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_text += f"\n{role.upper()}: {content}"

    prompt = f"""Mystery Context:
{context}

Recent conversation:{history_text}

Student action ({action_type}): {student_message}

Respond with JSON:
{{
  "narrative": "Vivid description of what the student discovers (2-4 paragraphs). Be immersive and scientific.",
  "new_clues": [
    {{
      "id": "clue_id_if_new",
      "title": "Clue title",
      "description": "What was found",
      "stem_concept": "Related STEM concept",
      "is_key_evidence": true
    }}
  ],
  "world_state_changes": {{
    "any_key": "updated value if world changes"
  }},
  "stem_challenge": {{
    "question": "STEM question to answer (or null)",
    "type": "calculation/multiple_choice/experiment/observation",
    "options": ["option 1", "option 2"],
    "hint": "Gentle hint"
  }},
  "xp_earned": 25,
  "is_plot_twist": false,
  "plot_twist_description": null,
  "investigation_progress_delta": 5
}}"""

    raw = await _call_ai(prompt, DUNGEON_MASTER_SYSTEM)
    return json.loads(raw)


async def stream_dungeon_master(
    case_data: dict,
    student_message: str,
    action_type: str,
    conversation_history: list,
) -> AsyncGenerator[str, None]:
    """Stream dungeon master response — falls back to non-streaming with chunked yield."""
    result = await dungeon_master_response(case_data, student_message, action_type, conversation_history)
    text = json.dumps(result)
    # Simulate streaming by yielding in chunks
    chunk_size = 50
    for i in range(0, len(text), chunk_size):
        yield text[i:i + chunk_size]


async def analyze_evidence(
    evidence_description: str,
    case_context: str,
    student_interpretation: Optional[str] = None,
) -> dict:
    """Analyze uploaded evidence with detective-style AI feedback."""

    prompt = f"""Analyze this evidence like a forensic scientist and STEM tutor:

Case Context: {case_context}
Evidence: {evidence_description}
{f'Student Interpretation: {student_interpretation}' if student_interpretation else ''}

Return JSON:
{{
  "relevance_score": 0.0,
  "analysis": "Detailed scientific analysis (100-150 words)",
  "detective_feedback": "Encouraging detective-style feedback to student",
  "stem_concepts_present": ["concepts visible in evidence"],
  "is_key_evidence": false,
  "follow_up_suggestions": ["What to investigate next"],
  "accuracy_feedback": "If student interpretation provided, is it accurate?"
}}"""

    raw = await _call_ai(prompt, "You are a forensic scientist and STEM educator. Respond with valid JSON only.")
    return json.loads(raw)


async def generate_hint(
    case_data: dict,
    hint_level: int,
    conversation_history: list,
) -> dict:
    """Generate a leveled hint that guides without revealing answers."""

    hint_instructions = {
        1: "Give a very general nudge about the direction to look. No specifics.",
        2: "Remind the student of a relevant STEM concept they need. Still no direct answer.",
        3: "Point toward a specific clue or experiment. Be more directed.",
        4: "Give a near-solution hint. Guide them to the answer without stating it.",
    }

    prompt = f"""Mystery: {case_data['title']}
Topic: {case_data.get('topic', '')}
Current progress: {case_data.get('progress_percentage', 0)}%
Hint Level: {hint_level} - {hint_instructions.get(hint_level, '')}

Generate a hint following the Socratic method. Never state the answer directly.

Return JSON:
{{
  "hint_text": "The hint text",
  "hint_level": {hint_level},
  "xp_penalty": {hint_level * 10}
}}"""

    raw = await _call_ai(prompt, "You are a STEM tutor. Use the Socratic method. Never give direct answers. Respond with valid JSON only.")
    return json.loads(raw)


async def evaluate_hypothesis(
    hypothesis: str,
    case_data: dict,
    evidence_collected: list,
) -> dict:
    """Evaluate student's final hypothesis against the case solution."""

    prompt = f"""Mystery: {case_data['title']}
Actual Solution: {case_data.get('solution', '')}
Key STEM Concepts: {case_data.get('stem_concepts', [])}

Student's Hypothesis: {hypothesis}
Evidence They Collected: {[e.get('title', '') for e in evidence_collected]}

Evaluate objectively. Return JSON:
{{
  "is_correct": false,
  "score": 0.0,
  "feedback": "Detailed personalized feedback (100-150 words)",
  "what_was_right": ["Correct elements"],
  "what_was_wrong": ["Incorrect elements if any"],
  "solution_explanation": "Full explanation of the real solution with STEM context (150-200 words)",
  "concepts_learned": ["STEM concepts they demonstrated understanding of"],
  "xp_earned": 200
}}"""

    raw = await _call_ai(prompt, "You are a STEM educator evaluating student work. Be encouraging but accurate. Respond with valid JSON only.")
    return json.loads(raw)


async def generate_experiment(
    lab_type: str,
    hypothesis: str,
    case_context: str,
    parameters: dict,
) -> dict:
    """Generate and simulate a virtual lab experiment."""

    prompt = f"""Generate and simulate a virtual {lab_type} experiment:

Case Context: {case_context}
Student Hypothesis: {hypothesis}
Parameters provided: {json.dumps(parameters)}

Return JSON:
{{
  "experiment_name": "Name",
  "procedure": ["Step 1", "Step 2", "..."],
  "variables": {{
    "independent": "What the student controls",
    "dependent": "What is measured",
    "controlled": ["Constants"]
  }},
  "results": {{
    "raw_data": {{}},
    "observations": ["What was observed"],
    "data_points": []
  }},
  "conclusion": "What the results mean scientifically",
  "is_hypothesis_supported": false,
  "feedback": "Educational feedback on their experiment",
  "stem_concepts_reinforced": ["Concepts this reinforces"],
  "visualization_data": {{
    "chart_type": "bar",
    "labels": [],
    "values": []
  }},
  "xp_earned": 75
}}"""

    raw = await _call_ai(prompt, "You are a virtual lab assistant. Simulate realistic experiments with real science. Respond with valid JSON only.")
    return json.loads(raw)


async def generate_mystery_studio(
    topic: str,
    subject: str,
    grade_level: str,
    difficulty: str,
    learning_objectives: list,
    duration_minutes: int,
) -> dict:
    """Teacher Mystery Studio: generate a complete classroom mystery package."""

    prompt = f"""Create a complete classroom mystery package for teachers:

Topic: {topic}
Subject: {subject}
Grade Level: {grade_level}
Difficulty: {difficulty}
Learning Objectives: {learning_objectives}
Duration: {duration_minutes} minutes

Return a comprehensive JSON mystery package:
{{
  "mystery": {{
    "title": "Mystery title",
    "tagline": "Hook",
    "story": "Story intro (200-300 words)",
    "stem_concepts": ["concepts"],
    "investigation_path": ["Step 1", "Step 2"],
    "clues": [],
    "solution": "Solution explanation",
    "world_state": {{"severity": "medium", "environment_status": "Initial state", "affected_entities": [], "escalation_events": []}}
  }},
  "teacher_guide": {{
    "pre_lesson_prep": ["..."],
    "discussion_questions": ["..."],
    "key_concepts_to_emphasize": ["..."],
    "common_misconceptions": ["..."],
    "differentiation_tips": {{
      "struggling_students": ["..."],
      "advanced_students": ["..."]
    }}
  }},
  "assessment": {{
    "formative": ["Questions to ask during investigation"],
    "summative": ["Final assessment questions"],
    "rubric": {{
      "scientific_reasoning": "Criteria",
      "evidence_use": "Criteria",
      "hypothesis_quality": "Criteria"
    }}
  }},
  "extension_activities": ["..."],
  "curriculum_standards": ["Related standards this addresses"]
}}"""

    raw = await _call_ai(prompt, "You are an expert curriculum designer and science educator. Create pedagogically sound mysteries. Respond with valid JSON only.")
    return json.loads(raw)
