import json
import re
from typing import Optional, AsyncGenerator
import openai
from app.core.config import settings

client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Gemini integration (fallback)
_gemini_client = None

def get_gemini_client():
    global _gemini_client
    if _gemini_client is None and settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            _gemini_client = genai.GenerativeModel('gemini-2.0-flash')
        except ImportError:
            pass
    return _gemini_client


async def _call_ai(prompt: str, system: str, use_gemini: bool = False) -> str:
    """Call AI with OpenAI (primary) or Gemini (fallback)."""
    try:
        resp = await client.chat.completions.create(
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
    except Exception as e:
        # Try Gemini as fallback
        gem = get_gemini_client()
        if gem:
            full_prompt = f"{system}\n\n{prompt}\n\nRespond with valid JSON only."
            resp = gem.generate_content(full_prompt)
            text = resp.text
            # Clean markdown fences if present
            text = re.sub(r'^```json\s*', '', text.strip())
            text = re.sub(r'```\s*$', '', text.strip())
            return text
        raise e


async def stream_dungeon_master(
    case_data: dict,
    student_message: str,
    action_type: str,
    conversation_history: list,
) -> AsyncGenerator[str, None]:
    """Stream dungeon master response chunks for real-time UI."""
    history_formatted = [
        {"role": m["role"], "content": m["content"]}
        for m in conversation_history[-20:]
    ]

    prompt = _build_dm_prompt(case_data, student_message, action_type)
    messages = [
        {"role": "system", "content": DUNGEON_MASTER_SYSTEM},
        *history_formatted,
        {"role": "user", "content": prompt},
    ]

    try:
        stream = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
            max_tokens=1024,
            temperature=0.9,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    except Exception:
        # Fall back to non-streaming
        result = await dungeon_master_response(case_data, student_message, action_type, conversation_history)
        yield json.dumps(result)


def _build_dm_prompt(case_data: dict, student_message: str, action_type: str) -> str:
    """Build the dungeon master prompt for streaming or non-streaming calls."""
    context = f"""Current Mystery: {case_data.get('title', 'Unknown')}
Topic: {case_data.get('topic', '')}
Subject: {case_data.get('subject', '')}
World State: {json.dumps(case_data.get('world_state', {}), indent=2)}
Revealed Clues: {[c['title'] for c in case_data.get('clues', []) if c.get('is_revealed')]}
Progress: {case_data.get('progress_percentage', 0)}%"""

    return f"""Mystery Context:
{context}

Student action ({action_type}): {student_message}

Respond with JSON:
{{
  "narrative": "Vivid description of what the student discovers (2-4 paragraphs). Be immersive and scientific.",
  "new_clues": [],
  "world_state_changes": {{}},
  "stem_challenge": null,
  "xp_earned": 25,
  "is_plot_twist": false,
  "plot_twist_description": null,
  "investigation_progress_delta": 5
}}"""


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

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": MYSTERY_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
        max_tokens=4000,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


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

    messages = [
        {"role": "system", "content": DUNGEON_MASTER_SYSTEM},
        {"role": "user", "content": f"Mystery Context:\n{context}"},
    ]

    for msg in conversation_history[-10:]:  # last 10 messages for context
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({
        "role": "user",
        "content": f"""Student action ({action_type}): {student_message}

Respond with JSON:
{{
  "narrative": "Vivid description of what the student discovers (2-4 paragraphs). Be immersive and scientific.",
  "new_clues": [
    {{
      "id": "clue_id_if_new",
      "title": "Clue title",
      "description": "What was found",
      "stem_concept": "Related STEM concept",
      "is_key_evidence": true/false
    }}
  ],
  "world_state_changes": {{
    "any_key": "updated value if world changes"
  }},
  "stem_challenge": {{
    "question": "STEM question to answer (or null)",
    "type": "calculation/multiple_choice/experiment/observation",
    "options": ["option 1", "option 2"] or null,
    "hint": "Gentle hint"
  }},
  "xp_earned": 25,
  "is_plot_twist": false,
  "plot_twist_description": null,
  "investigation_progress_delta": 5
}}"""
    })

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.75,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


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
  "relevance_score": 0.0-1.0,
  "analysis": "Detailed scientific analysis (100-150 words)",
  "detective_feedback": "Encouraging detective-style feedback to student",
  "stem_concepts_present": ["concepts visible in evidence"],
  "is_key_evidence": true/false,
  "follow_up_suggestions": ["What to investigate next"],
  "accuracy_feedback": "If student interpretation provided, is it accurate?"
}}"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a forensic scientist and STEM educator. Respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


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

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a STEM tutor. Use the Socratic method. Never give direct answers. Respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.6,
        max_tokens=300,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


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
  "is_correct": true/false,
  "score": 0.0-1.0,
  "feedback": "Detailed personalized feedback (100-150 words)",
  "what_was_right": ["Correct elements"],
  "what_was_wrong": ["Incorrect elements if any"],
  "solution_explanation": "Full explanation of the real solution with STEM context (150-200 words)",
  "concepts_learned": ["STEM concepts they demonstrated understanding of"],
  "xp_earned": 0-500
}}"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a STEM educator evaluating student work. Be encouraging but accurate. Respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


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
  "is_hypothesis_supported": true/false,
  "feedback": "Educational feedback on their experiment",
  "stem_concepts_reinforced": ["Concepts this reinforces"],
  "visualization_data": {{
    "chart_type": "bar/line/scatter",
    "labels": [],
    "values": []
  }},
  "xp_earned": 50-150
}}"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a virtual lab assistant. Simulate realistic experiments with real science. Respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        max_tokens=1200,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


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

Return a comprehensive JSON mystery package including:
- Full mystery (same structure as standard mystery generation)
- Teacher guide with discussion questions
- Assessment rubric
- Common student misconceptions to watch for
- Extension activities for advanced students
- Accessibility adaptations

JSON structure:
{{
  "mystery": {{... standard mystery structure ...}},
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

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert curriculum designer and science educator. Create pedagogically sound mysteries. Respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=5000,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
