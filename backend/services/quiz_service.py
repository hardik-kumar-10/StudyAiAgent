"""
Quiz Service — generates quizzes using AI from documents or topics.
"""

from backend.services import ai_service, document_service


async def generate_quiz(
    topic: str | None = None,
    document_id: str | None = None,
    num_questions: int = 5,
    difficulty: str = "medium",
) -> list[dict]:
    """Generate a quiz from a topic string or uploaded document."""

    if document_id:
        source = document_service.get_document_text(document_id)
        if not source:
            raise ValueError(f"Document '{document_id}' not found.")
    elif topic:
        source = f"Topic: {topic}. Generate quiz questions about this topic."
    else:
        raise ValueError("Provide either a topic or a document_id.")

    return await ai_service.generate_quiz(source, num_questions, difficulty)
