"""
AI Service — wraps Google Gemini for all AI-powered features.
"""

import json
from anthropic import AsyncAnthropic
from backend.config import ANTHROPIC_API_KEY, CLAUDE_MODEL

client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """You are **StudyBuddy AI**, a warm, patient, and encouraging tutor.
Your goals:
• Explain concepts clearly with real-world analogies and examples.
• Adjust complexity to the student's level.
• Celebrate progress and gently correct mistakes.
• Use markdown formatting (bold, lists, code blocks) for clarity.
• When asked to summarise, be concise yet thorough.
• Never fabricate facts — say "I'm not sure" if uncertain.
"""


# ── Chat ──────────────────────────────────────────────
async def chat(message: str, history: list[dict], document_context: str | None = None) -> str:
    """Send a message to the AI tutor and get a response."""

    # Build conversation history for Anthropic
    messages = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["content"]})

    # If there's document context, prepend it
    user_msg = message
    if document_context:
        user_msg = (
            f"[The student has uploaded a document. Here is the relevant text for context:]\n\n"
            f"{document_context[:10000]}\n\n"
            f"[Student's question:] {message}"
        )

    messages.append({"role": "user", "content": user_msg})

    response = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=messages
    )
    return response.content[0].text


# ── Summarize ─────────────────────────────────────────
async def summarize(text: str, max_points: int = 10) -> str:
    """Summarize document text into key points."""
    prompt = (
        f"Summarize the following text into at most {max_points} clear, concise bullet points. "
        f"Use markdown bullet formatting.\n\n---\n\n{text[:15000]}"
    )
    response = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text


# ── Explain ───────────────────────────────────────────
async def explain_concept(topic: str, depth: str = "medium") -> str:
    """Explain a concept at the requested depth."""
    depth_map = {
        "brief": "Give a brief 2-3 sentence explanation.",
        "medium": "Give a clear explanation with examples and analogies. About 2-3 paragraphs.",
        "detailed": "Give an in-depth, comprehensive explanation with multiple examples, analogies, and edge cases. Use headings and subheadings.",
    }
    prompt = f"Explain the concept: **{topic}**\n\n{depth_map.get(depth, depth_map['medium'])}"
    response = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text


# ── Quiz Generation ───────────────────────────────────
async def generate_quiz(source_text: str, num_questions: int = 5, difficulty: str = "medium") -> list[dict]:
    """Generate MCQ quiz questions from source text."""
    prompt = (
        f"Generate exactly {num_questions} multiple-choice quiz questions at {difficulty} difficulty "
        f"based on the following text. Each question must have exactly 4 options.\n\n"
        f"Respond ONLY with a valid JSON array, no extra text. Each object must have:\n"
        f'  "question": string,\n'
        f'  "options": [string, string, string, string],\n'
        f'  "correct": integer (0-3 index of correct option),\n'
        f'  "explanation": string (brief explanation of the answer)\n\n'
        f"---\n\n{source_text[:12000]}"
    )
    response = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = response.content[0].text.strip()

    # Extract JSON from possible markdown code block
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)


# ── Flashcard Generation ──────────────────────────────
async def generate_flashcards(source_text: str, num_cards: int = 10) -> list[dict]:
    """Generate flashcards from source text."""
    prompt = (
        f"Generate exactly {num_cards} study flashcards based on the following text.\n\n"
        f"Respond ONLY with a valid JSON array, no extra text. Each object must have:\n"
        f'  "term": string (the concept or keyword),\n'
        f'  "definition": string (clear, concise definition),\n'
        f'  "example": string (a practical example or use case)\n\n'
        f"---\n\n{source_text[:12000]}"
    )
    response = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = response.content[0].text.strip()

    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)

