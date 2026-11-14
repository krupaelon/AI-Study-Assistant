"""
Wraps all calls to the Groq LLM API. Every function here is responsible for:
  1. Building a well-scoped prompt (grounded strictly in the note text where required).
  2. Requesting structured JSON output from the model.
  3. Safely parsing that JSON and raising a clean HTTPException on failure.
"""
import json
import re

from fastapi import HTTPException, status
from groq import Groq

from app.core.config import settings

_client: Groq | None = None

# Roughly cap how much note text we send per request to stay within context limits.
MAX_NOTE_CHARS = 12000


def get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured. Missing GROQ_API_KEY.",
            )
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def _truncate(text: str, max_chars: int = MAX_NOTE_CHARS) -> str:
    return text if len(text) <= max_chars else text[:max_chars] + "\n...[truncated]"


def _extract_json(raw_text: str) -> dict:
    """Strips markdown code fences and parses the first JSON object/array found."""
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```json\s*|^```\s*|```$", "", cleaned, flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service returned an unexpected response format. Please try again.",
        )


def _chat_json(system_prompt: str, user_prompt: str, temperature: float = 0.4) -> dict:
    client = get_client()
    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service request failed: {exc}",
        )

    raw = completion.choices[0].message.content or ""
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# 1. Summary generation
# ---------------------------------------------------------------------------
def generate_summary(note_text: str) -> dict:
    system_prompt = (
        "You are an expert academic study assistant. You produce clear, exam-focused "
        "summaries of lecture notes. Respond ONLY with a single JSON object, no prose "
        "before or after it."
    )
    user_prompt = f"""
Analyze the following lecture notes and respond with a JSON object with EXACTLY these keys:
- "summary_text": a concise 3-6 sentence summary of the whole content.
- "key_points": an array of 5-10 short bullet-point strings covering the most important ideas.
- "definitions": an array of strings, each formatted as "Term: definition", for key terms found in the notes. Empty array if none.
- "formulas": an array of strings for any important formulas or equations found in the notes. Empty array if none.
- "exam_tips": an array of 3-6 short strings with practical tips for what to focus on for exams.

NOTES:
\"\"\"{_truncate(note_text)}\"\"\"
"""
    data = _chat_json(system_prompt, user_prompt)
    return {
        "summary_text": data.get("summary_text", ""),
        "key_points": data.get("key_points", []) or [],
        "definitions": data.get("definitions", []) or [],
        "formulas": data.get("formulas", []) or [],
        "exam_tips": data.get("exam_tips", []) or [],
    }


# ---------------------------------------------------------------------------
# 2. Ask AI - answers ONLY from the note content
# ---------------------------------------------------------------------------
NOT_COVERED_MESSAGE = "This topic is not covered in the uploaded notes."


def ask_question(note_text: str, question: str) -> dict:
    system_prompt = (
        "You are a strict study assistant. You must answer the student's question using "
        "ONLY the information contained in the provided notes. Do not use outside knowledge. "
        "If the answer cannot be found in the notes, you must say so exactly. "
        "Respond ONLY with a single JSON object, no prose before or after it."
    )
    user_prompt = f"""
NOTES:
\"\"\"{_truncate(note_text)}\"\"\"

STUDENT QUESTION: "{question}"

Respond with a JSON object with EXACTLY these keys:
- "grounded": true if the notes contain enough information to answer, false otherwise.
- "answer": if grounded is true, a clear, direct answer based only on the notes. If grounded is false, respond with exactly this string: "{NOT_COVERED_MESSAGE}"
"""
    data = _chat_json(system_prompt, user_prompt, temperature=0.2)
    grounded = bool(data.get("grounded", False))
    answer = data.get("answer") or NOT_COVERED_MESSAGE
    if not grounded:
        answer = NOT_COVERED_MESSAGE
    return {"answer": answer, "grounded": grounded}


# ---------------------------------------------------------------------------
# 3. Quiz generation
# ---------------------------------------------------------------------------
def generate_quiz(note_text: str, num_questions: int) -> dict:
    system_prompt = (
        "You are an expert exam question writer. You create multiple-choice questions "
        "strictly based on provided study notes. Respond ONLY with a single JSON object."
    )
    user_prompt = f"""
Based on the notes below, generate exactly {num_questions} multiple-choice questions.

Respond with a JSON object with EXACTLY this shape:
{{
  "questions": [
    {{
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "must be an exact copy of one of the 4 options",
      "explanation": "short explanation of why the answer is correct"
    }}
  ]
}}

Ensure "questions" has exactly {num_questions} items, each with exactly 4 options.

NOTES:
\"\"\"{_truncate(note_text)}\"\"\"
"""
    data = _chat_json(system_prompt, user_prompt, temperature=0.5)
    questions = data.get("questions", []) or []
    return {"questions": questions[:num_questions]}


# ---------------------------------------------------------------------------
# 4. Flashcards
# ---------------------------------------------------------------------------
def generate_flashcards(note_text: str, num_cards: int) -> dict:
    system_prompt = (
        "You are an expert study coach who creates concise flashcards for spaced-repetition "
        "learning, strictly based on provided notes. Respond ONLY with a single JSON object."
    )
    user_prompt = f"""
Based on the notes below, generate exactly {num_cards} flashcards.

Respond with a JSON object with EXACTLY this shape:
{{
  "cards": [
    {{ "question": "short question or term", "answer": "concise answer or definition" }}
  ]
}}

Ensure "cards" has exactly {num_cards} items.

NOTES:
\"\"\"{_truncate(note_text)}\"\"\"
"""
    data = _chat_json(system_prompt, user_prompt, temperature=0.5)
    cards = data.get("cards", []) or []
    return {"cards": cards[:num_cards]}


# ---------------------------------------------------------------------------
# 5. Explain Simply
# ---------------------------------------------------------------------------
def explain_simply(text: str) -> dict:
    system_prompt = (
        "You are a friendly teacher who explains complex ideas to a 12-year-old using "
        "simple words, short sentences, and relatable analogies. Respond ONLY with a "
        "single JSON object."
    )
    user_prompt = f"""
Rewrite the following text so a 12-year-old could easily understand it. Use simple
vocabulary and a helpful analogy if useful.

Respond with a JSON object with EXACTLY this key:
- "simple_explanation": the simplified explanation as a string.

TEXT:
\"\"\"{_truncate(text, 4000)}\"\"\"
"""
    data = _chat_json(system_prompt, user_prompt, temperature=0.6)
    return {"simple_explanation": data.get("simple_explanation", "")}


# ---------------------------------------------------------------------------
# 6. Study Planner
# ---------------------------------------------------------------------------
def generate_study_plan(topics_summary: str, days_available: int, hours_per_day: float) -> dict:
    system_prompt = (
        "You are an expert academic study planner. You create realistic, balanced daily "
        "revision schedules. Respond ONLY with a single JSON object."
    )
    user_prompt = f"""
A student has {days_available} day(s) until their exam and can study {hours_per_day} hour(s) per day.
Here is a summary of the topics they need to cover across their subject notes:
\"\"\"{_truncate(topics_summary, 6000)}\"\"\"

Create a day-by-day revision schedule. Distribute topics logically (foundational topics
first, revision/practice closer to the exam). Respond with a JSON object with EXACTLY
this shape:
{{
  "days": [
    {{ "day_offset": 0, "topics": ["string", "string"], "hours": {hours_per_day} }}
  ]
}}

"day_offset" is an integer starting at 0 (today) up to {days_available - 1}.
Include exactly {days_available} day entries.
"""
    data = _chat_json(system_prompt, user_prompt, temperature=0.4)
    return {"days": data.get("days", []) or []}


# ---------------------------------------------------------------------------
# 7. Mock Paper
# ---------------------------------------------------------------------------
def generate_mock_paper(note_text: str, num_short: int, num_long: int) -> dict:
    system_prompt = (
        "You are an experienced university exam paper setter. You write exam-style "
        "short and long questions strictly based on provided notes. Respond ONLY with "
        "a single JSON object."
    )
    user_prompt = f"""
Based on the notes below, write exactly {num_short} short-answer questions (2-4 marks
each) and exactly {num_long} long-answer questions (8-10 marks each, may include
sub-parts a/b).

Respond with a JSON object with EXACTLY this shape:
{{
  "short_questions": ["string", "..."],
  "long_questions": ["string", "..."]
}}

NOTES:
\"\"\"{_truncate(note_text)}\"\"\"
"""
    data = _chat_json(system_prompt, user_prompt, temperature=0.5)
    return {
        "short_questions": (data.get("short_questions", []) or [])[:num_short],
        "long_questions": (data.get("long_questions", []) or [])[:num_long],
    }
# ---------------------------------------------------------------------------
# 8. Resume Analysis + ATS Score
# ---------------------------------------------------------------------------
def analyze_resume(resume_text: str) -> dict:
    system_prompt = (
        "You are an expert ATS resume analyzer and career coach. "
        "Analyze resumes objectively and provide practical feedback. "
        "Respond ONLY with a single JSON object, no prose before or after it."
    )

    user_prompt = f"""
Analyze the following resume and provide an ATS-friendly evaluation.

Return a JSON object with EXACTLY these keys:

- "ats_score": an integer from 0 to 100 representing overall ATS compatibility.
- "summary": a short 3-5 sentence professional summary of the candidate.
- "skills": an array of technical and professional skills detected in the resume.
- "strengths": an array of 3-6 strong points in the resume.
- "weaknesses": an array of 3-6 areas that could be improved.
- "missing_skills": an array of useful skills that appear to be missing based on the candidate's profile.
- "suggestions": an array of 5-8 specific improvements the candidate should make.
- "recommended_roles": an array of 3-5 suitable job roles based on the resume.

ATS SCORING GUIDELINES:
- Check clarity and structure.
- Check presence of relevant technical skills.
- Check education and experience information.
- Check projects and achievements.
- Check use of professional keywords.
- Check readability and ATS-friendly formatting.
- Do NOT invent experience, skills, certifications, or achievements that are not present.

RESUME:
\"\"\"{_truncate(resume_text)}\"\"\"
"""

    data = _chat_json(system_prompt, user_prompt, temperature=0.3)

    return {
        "ats_score": int(data.get("ats_score", 0)),
        "summary": data.get("summary", ""),
        "skills": data.get("skills", []) or [],
        "strengths": data.get("strengths", []) or [],
        "weaknesses": data.get("weaknesses", []) or [],
        "missing_skills": data.get("missing_skills", []) or [],
        "suggestions": data.get("suggestions", []) or [],
        "recommended_roles": data.get("recommended_roles", []) or [],
    }
# ---------------------------------------------------------------------------
# 9. Job Description Matching
# ---------------------------------------------------------------------------
def match_resume_to_job(resume_text: str, job_description: str) -> dict:
    system_prompt = (
        "You are an expert ATS resume matcher and career coach. "
        "Compare a candidate's resume with a job description objectively. "
        "Do not invent skills or experience. "
        "Respond ONLY with a single JSON object, no prose before or after it."
    )

    user_prompt = f"""
Compare the following resume against the given job description.

Return a JSON object with EXACTLY these keys:

- "match_score": an integer from 0 to 100 representing how well the resume matches the job.
- "matching_skills": an array of skills/keywords present in both the resume and job description.
- "missing_skills": an array of important job-related skills/keywords missing from the resume.
- "matching_experience": an array of relevant experience or projects from the resume that match the job requirements.
- "recommendations": an array of 5-7 specific recommendations to improve the resume for this particular job.
- "job_fit_summary": a short 3-5 sentence explanation of how suitable the candidate is for this job.

SCORING GUIDELINES:
- Consider technical skills and keywords.
- Consider projects and practical experience.
- Consider education and relevant certifications.
- Consider job requirements and responsibilities.
- Give higher scores when important requirements are clearly supported by the resume.
- Do NOT give credit for skills or experience that are not actually present in the resume.

RESUME:
\"\"\"{_truncate(resume_text)}\"\"\"

JOB DESCRIPTION:
\"\"\"{_truncate(job_description, 10000)}\"\"\"
"""

    data = _chat_json(system_prompt, user_prompt, temperature=0.3)

    return {
        "match_score": int(data.get("match_score", 0)),
        "matching_skills": data.get("matching_skills", []) or [],
        "missing_skills": data.get("missing_skills", []) or [],
        "matching_experience": data.get("matching_experience", []) or [],
        "recommendations": data.get("recommendations", []) or [],
        "job_fit_summary": data.get("job_fit_summary", ""),
    }
def generate_interview_questions(
    resume_text: str,
    role: str,
    difficulty: str = "medium",
    num_questions: int = 5,
) -> dict:
    system_prompt = (
        "You are an expert technical interviewer and career coach. "
        "Generate realistic interview questions based on the candidate's resume "
        "and target job role. "
        "Do not invent experience that is not present in the resume. "
        "Respond ONLY with a single JSON object."
    )

    user_prompt = f"""
Create a mock interview for the following candidate.

Target role:
{role}

Difficulty:
{difficulty}

Number of questions:
{num_questions}

Candidate resume:
{_truncate(resume_text, 12000)}

Return a JSON object with EXACTLY these keys:

- "role": the target role
- "difficulty": the difficulty level
- "questions": an array of interview question objects

Each question object must contain:
- "question_number": integer
- "question": interview question
- "type": one of "technical", "project", "behavioral", or "hr"
- "expected_focus": short explanation of what a good answer should cover

Make the questions relevant to the candidate's resume and target role.
Include a mixture of technical, project, behavioral, and HR questions.
"""

    data = _chat_json(
        system_prompt,
        user_prompt,
        temperature=0.5,
    )

    return {
        "role": data.get("role", role),
        "difficulty": data.get("difficulty", difficulty),
        "questions": data.get("questions", []) or [],
    }
def evaluate_interview_answers(
    role: str,
    questions: list,
    answers: list,
) -> dict:
    system_prompt = (
        "You are an expert technical interviewer and career coach. "
        "Evaluate a candidate's mock interview answers fairly and constructively. "
        "Evaluate only what the candidate actually answered. "
        "Do not invent experience or skills that are not present in the answers. "
        "Return ONLY a valid JSON object."
    )

    interview_data = []

    for question in questions:
        question_number = question.get("question_number")
        candidate_answer = ""

        for answer in answers:
            if answer.get("question_number") == question_number:
                candidate_answer = answer.get("answer", "")
                break

        interview_data.append({
            "question_number": question_number,
            "question": question.get("question", ""),
            "type": question.get("type", ""),
            "expected_focus": question.get("expected_focus", ""),
            "candidate_answer": candidate_answer,
        })

    user_prompt = f"""
Evaluate the following mock interview.

Target role:
{role}

Interview questions and candidate answers:
{interview_data}

Return a JSON object with EXACTLY these keys:

- "overall_score": integer from 0 to 100
- "overall_feedback": short overall evaluation
- "strengths": array of strings
- "weaknesses": array of strings
- "improvement_suggestions": array of strings
- "question_feedback": array

Each item in "question_feedback" must contain:

- "question_number": integer
- "score": integer from 0 to 100
- "feedback": short explanation
- "what_was_good": short explanation
- "what_to_improve": short explanation

Evaluate based on:
1. Technical correctness
2. Relevance to the question
3. Clarity
4. Completeness
5. Communication quality

Be realistic and constructive.
"""

    data = _chat_json(
        system_prompt,
        user_prompt,
        temperature=0.3,
    )

    return {
        "overall_score": int(data.get("overall_score", 0)),
        "overall_feedback": data.get("overall_feedback", ""),
        "strengths": data.get("strengths", []) or [],
        "weaknesses": data.get("weaknesses", []) or [],
        "improvement_suggestions": data.get(
            "improvement_suggestions", []
        ) or [],
        "question_feedback": data.get("question_feedback", []) or [],
    }
def analyze_communication(answer: str):
    system_prompt = """
You are an AI communication coach for students preparing for job interviews.

Analyze ONLY the answer provided by the student.

Evaluate:
1. Clarity
2. Grammar
3. Confidence
4. Professionalism
5. Overall communication

Give scores from 0 to 100.

Also provide:
- strengths
- areas for improvement
- specific suggestions
- an improved version of the answer

Return ONLY valid JSON in this format:

{
  "clarity_score": 0,
  "grammar_score": 0,
  "confidence_score": 0,
  "professionalism_score": 0,
  "overall_score": 0,
  "strengths": [],
  "areas_for_improvement": [],
  "suggestions": [],
  "improved_answer": ""
}
"""

    user_prompt = f"""
Analyze this interview answer:

{answer}
"""

    return _chat_json(
        system_prompt,
        user_prompt,
        temperature=0.3,
    )
def generate_career_guidance(
    target_role: str,
    current_skills: str,
    interests: str,
    areas_to_improve: str,
):
    system_prompt = """
You are an AI career guidance assistant for college students
preparing for software and technology careers.

Analyze ONLY the information provided by the student.

Provide practical, realistic and personalized career guidance.

Return ONLY valid JSON in this format:

{
  "career_direction": "",
  "strengths": [],
  "skill_gaps": [],
  "technologies_to_learn": [],
  "learning_priorities": [],
  "career_roadmap": [
    {
      "stage": "",
      "focus": "",
      "recommended_actions": []
    }
  ],
  "interview_preparation": [],
  "final_advice": ""
}

Important rules:
- Do not invent projects, achievements, work experience or certifications.
- Do not claim that the student has a skill unless it is provided.
- Recommend skills and technologies that are relevant to the target role.
- Keep the roadmap practical for a college student.
"""

    user_prompt = f"""
Target role:
{target_role}

Current skills:
{current_skills}

Career interests:
{interests}

Areas to improve:
{areas_to_improve}
"""

    return _chat_json(
        system_prompt,
        user_prompt,
        temperature=0.4,
    )