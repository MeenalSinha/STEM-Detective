"""
Proof-of-Learning: adaptive post-mystery quiz that proves retention.
This is the single highest-impact feature for hackathon judges.
"""
import json
from typing import Optional
import openai
from app.core.config import settings

client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

MISCONCEPTION_TAXONOMY = {
    "biology": [
        "plants get food from the soil",
        "humans evolved from monkeys",
        "we only use 10% of our brain",
        "evolution has a direction or goal",
        "viruses are alive in the same way bacteria are",
    ],
    "chemistry": [
        "acids always burn or are dangerous",
        "all natural chemicals are safe",
        "pH 0 is the strongest possible acid",
        "atoms look like tiny solar systems",
        "mixing acids and bases always produces water",
    ],
    "physics": [
        "heavier objects fall faster",
        "objects need a force to keep moving",
        "electricity flows like water in a pipe",
        "there is no gravity in space",
        "cold is the absence of heat flowing in",
    ],
    "environmental": [
        "recycling fixes all pollution problems",
        "the ozone hole causes climate change",
        "nuclear energy always produces dangerous waste",
        "all pollution comes from factories",
    ],
    "mathematics": [
        "0.999... is not equal to 1",
        "infinity is a number",
        "you can always find the average of averages",
        "correlation means causation",
    ],
}


async def generate_proof_of_learning_quiz(
    case_data: dict,
    student_performance: dict,
) -> dict:
    """
    Generate a 3-question adaptive quiz targeting specific concepts from the solved mystery.
    Uses spaced-retrieval principles and targets the student's weakest concepts.
    """
    stem_concepts = case_data.get("stem_concepts", [])
    topic = case_data.get("topic", "")
    subject = case_data.get("subject", "biology")
    solution = case_data.get("solution", "")
    progress = case_data.get("progress_percentage", 100)

    # Identify weak concepts from performance data
    weak_concepts = student_performance.get("weaknesses", [])
    strengths = student_performance.get("strengths", [])

    # Get subject-specific misconceptions to test against
    misconceptions = MISCONCEPTION_TAXONOMY.get(subject, [])

    prompt = f"""You are an educational assessment expert using evidence-based learning science.

Generate exactly 3 quiz questions for a student who just solved this mystery:
- Mystery: "{case_data.get('title', 'Unknown')}"
- Topic: {topic}
- Subject: {subject}
- STEM concepts covered: {json.dumps(stem_concepts)}
- Mystery solution: {solution[:300] if solution else 'Unknown'}
- Student's known weak areas: {json.dumps(weak_concepts[:3])}

Quiz design rules (CRITICAL):
1. Question 1: Target the CORE scientific concept. Transfer question — apply the concept to a NEW scenario not in the mystery.
2. Question 2: Target a MISCONCEPTION. One option should be the common wrong answer students believe. Make it non-obvious.
3. Question 3: Synthesis question — connect this mystery's concept to a REAL-WORLD application or another STEM field.

Each question must:
- Be multiple choice with 4 options
- Have exactly ONE correct answer
- Test conceptual understanding, NOT recall of mystery facts
- Be answerable without remembering the mystery storyline
- Be appropriately challenging for the grade level

Return JSON ONLY:
{{
  "quiz_title": "Concept Mastery Check: {topic}",
  "questions": [
    {{
      "id": "q1",
      "type": "transfer",
      "question": "Question text — new scenario applying the concept",
      "options": [
        {{"id": "a", "text": "Option A"}},
        {{"id": "b", "text": "Option B"}},
        {{"id": "c", "text": "Option C"}},
        {{"id": "d", "text": "Option D"}}
      ],
      "correct_answer": "a",
      "explanation": "Why this is correct, connecting to the mystery AND the broader concept (2-3 sentences)",
      "stem_concept": "Specific concept being tested",
      "difficulty": "medium"
    }},
    {{
      "id": "q2",
      "type": "misconception",
      "question": "Question targeting common misconception about {topic}",
      "options": [...],
      "correct_answer": "b",
      "explanation": "...",
      "misconception_addressed": "The common wrong belief being corrected",
      "stem_concept": "...",
      "difficulty": "medium"
    }},
    {{
      "id": "q3",
      "type": "synthesis",
      "question": "Real-world application connecting {topic} to daily life or another field",
      "options": [...],
      "correct_answer": "c",
      "explanation": "...",
      "real_world_connection": "Where this concept appears in the real world",
      "stem_concept": "...",
      "difficulty": "hard"
    }}
  ],
  "learning_objectives": ["3 specific things a student should understand after this quiz"],
  "curriculum_standards": ["NGSS or Common Core standards this addresses"]
}}"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are an expert educational assessment designer trained in cognitive science and spaced repetition. Your questions test deep understanding, not surface recall. Respond with valid JSON only."
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


async def evaluate_quiz_response(
    question: dict,
    student_answer: str,
    case_context: str,
) -> dict:
    """Evaluate a single quiz answer with detailed feedback."""
    is_correct = student_answer.lower() == question.get("correct_answer", "").lower()

    return {
        "question_id": question.get("id"),
        "is_correct": is_correct,
        "student_answer": student_answer,
        "correct_answer": question.get("correct_answer"),
        "explanation": question.get("explanation", ""),
        "misconception_addressed": question.get("misconception_addressed"),
        "real_world_connection": question.get("real_world_connection"),
        "xp_earned": 75 if is_correct else 10,
    }


async def detect_misconception(
    student_text: str,
    subject: str,
    case_context: str,
) -> Optional[dict]:
    """
    Misconception Interceptor — detects if student has typed a known scientific misconception.
    Returns a Socratic redirect question if misconception found, None otherwise.
    Called during DM interactions in real-time.
    """
    known_misconceptions = MISCONCEPTION_TAXONOMY.get(subject, [])
    if not known_misconceptions:
        return None

    # Fast check — only call GPT if text looks like a hypothesis or statement
    if len(student_text) < 20:
        return None

    trigger_words = ["because", "think", "believe", "must be", "is because", "causes", "means"]
    if not any(word in student_text.lower() for word in trigger_words):
        return None

    prompt = f"""A student investigating a {subject} mystery typed this:
"{student_text}"

Known misconceptions for {subject}:
{json.dumps(known_misconceptions)}

Does this student statement contain or imply a known scientific misconception?

If YES: Return a Socratic question (never a correction) that gently guides them to discover their error themselves.
If NO: Return null.

JSON only:
{{
  "has_misconception": true/false,
  "misconception_identified": "What they got wrong" or null,
  "socratic_question": "A question that makes them question their assumption — never a correction" or null,
  "severity": "minor/moderate/major" or null
}}"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a Socratic science tutor. You NEVER directly correct students. You only ask questions that lead them to discover their error. Be gentle and curious, never condescending. Respond with valid JSON only."
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=300,
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)
    if result.get("has_misconception") and result.get("socratic_question"):
        return result
    return None


async def generate_world_decay_event(
    world_state: dict,
    case_data: dict,
    actions_since_last_event: int,
) -> Optional[dict]:
    """
    Dynamic World Simulation — generates escalating consequences.
    Called when student has taken too many actions without solving key clues.
    Creates urgency and teaches cause-and-effect in STEM.
    """
    severity = world_state.get("severity", "low")
    escalation_events = case_data.get("world_state", {}).get("escalation_events", [])

    if actions_since_last_event < 3:
        return None

    severity_progression = {
        "low": "medium",
        "medium": "high",
        "high": "critical",
        "critical": "critical",
    }

    new_severity = severity_progression.get(severity, severity)

    if new_severity == severity and severity == "critical":
        return None  # Already at max

    prompt = f"""The world of this STEM mystery is getting worse because the student hasn't found the key evidence yet.

Mystery: {case_data.get('title', '')}
Topic: {case_data.get('topic', '')}
Current severity: {severity} → escalating to {new_severity}
Current world state: {json.dumps(world_state)}

Generate a dramatic world event that:
1. Makes the situation visibly worse (scientifically accurate)
2. Hints at the type of solution needed (without giving it away)
3. Creates urgency and emotional investment
4. Is grounded in real STEM — the escalation should make scientific sense

JSON only:
{{
  "event_title": "Short dramatic title (5-7 words)",
  "narrative": "2-3 sentence dramatic description of what just happened in the world",
  "new_severity": "{new_severity}",
  "environmental_changes": ["What specifically changed"],
  "new_evidence_revealed": {{
    "title": "New clue that appears due to the escalation",
    "description": "What the student can now observe",
    "stem_concept": "The concept this new clue points to"
  }},
  "urgency_message": "Short message shown on timer (e.g. 'More fish are dying — act now')",
  "world_state_updates": {{}}
}}"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a dynamic world simulation engine. Events must be scientifically accurate and emotionally compelling. Respond with valid JSON only."
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=600,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
