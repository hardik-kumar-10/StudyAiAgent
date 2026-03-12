"""
StudyBuddy AI — FastAPI backend server.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from backend.models.schemas import (
    ChatRequest, ChatResponse,
    SummarizeRequest, SummarizeResponse,
    ExplainRequest, ExplainResponse,
    QuizRequest, QuizResponse,
    FlashcardRequest, FlashcardResponse,
)
from backend.services import ai_service, document_service, quiz_service, flashcard_service

app = FastAPI(title="StudyBuddy AI", version="1.0.0")

# CORS — allow all in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


# ── Chat ──────────────────────────────────────────────
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        doc_context = None
        if req.document_id:
            doc_context = document_service.get_document_text(req.document_id)
        history = [{"role": m.role, "content": m.content} for m in req.history]
        reply = await ai_service.chat(req.message, history, doc_context)
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Documents ─────────────────────────────────────────
@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        contents = await file.read()
        doc = await document_service.upload_document(file.filename, contents)
        return {
            "id": doc["id"],
            "filename": doc["filename"],
            "pages": doc["pages"],
            "preview": doc["text"][:200],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents")
async def list_documents():
    return document_service.list_documents()


# ── Summarize ─────────────────────────────────────────
@app.post("/api/summarize", response_model=SummarizeResponse)
async def summarize_endpoint(req: SummarizeRequest):
    text = document_service.get_document_text(req.document_id)
    if not text:
        raise HTTPException(status_code=404, detail="Document not found.")
    try:
        summary = await ai_service.summarize(text, req.max_points)
        return SummarizeResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Explain ───────────────────────────────────────────
@app.post("/api/explain", response_model=ExplainResponse)
async def explain_endpoint(req: ExplainRequest):
    try:
        explanation = await ai_service.explain_concept(req.topic, req.depth)
        return ExplainResponse(explanation=explanation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Quiz ──────────────────────────────────────────────
@app.post("/api/quiz/generate", response_model=QuizResponse)
async def generate_quiz_endpoint(req: QuizRequest):
    try:
        questions = await quiz_service.generate_quiz(
            topic=req.topic,
            document_id=req.document_id,
            num_questions=req.num_questions,
            difficulty=req.difficulty,
        )
        return QuizResponse(questions=questions)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Flashcards ────────────────────────────────────────
@app.post("/api/flashcards/generate", response_model=FlashcardResponse)
async def generate_flashcards_endpoint(req: FlashcardRequest):
    try:
        cards = await flashcard_service.generate_flashcards(
            topic=req.topic,
            document_id=req.document_id,
            num_cards=req.num_cards,
        )
        return FlashcardResponse(cards=cards)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Serve Frontend ────────────────────────────────────
app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")


@app.get("/")
async def serve_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))
