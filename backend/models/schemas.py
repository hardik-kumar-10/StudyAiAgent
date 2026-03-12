from pydantic import BaseModel
from typing import Optional


# ── Chat ──────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str          # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    document_id: Optional[str] = None   # optional doc context


class ChatResponse(BaseModel):
    reply: str


# ── Documents ─────────────────────────────────────────
class DocumentInfo(BaseModel):
    id: str
    filename: str
    pages: int
    preview: str       # first 200 chars


class SummarizeRequest(BaseModel):
    document_id: str
    max_points: int = 10


class SummarizeResponse(BaseModel):
    summary: str


# ── Explain ───────────────────────────────────────────
class ExplainRequest(BaseModel):
    topic: str
    depth: str = "medium"   # "brief" | "medium" | "detailed"


class ExplainResponse(BaseModel):
    explanation: str


# ── Quiz ──────────────────────────────────────────────
class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct: int        # index of correct option
    explanation: str


class QuizRequest(BaseModel):
    topic: Optional[str] = None
    document_id: Optional[str] = None
    num_questions: int = 5
    difficulty: str = "medium"   # "easy" | "medium" | "hard"


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]


# ── Flashcards ────────────────────────────────────────
class Flashcard(BaseModel):
    term: str
    definition: str
    example: str


class FlashcardRequest(BaseModel):
    topic: Optional[str] = None
    document_id: Optional[str] = None
    num_cards: int = 10


class FlashcardResponse(BaseModel):
    cards: list[Flashcard]
