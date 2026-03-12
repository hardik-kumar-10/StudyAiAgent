"""
Flashcard Service — generates flashcards using AI from documents or topics.
"""

from backend.services import ai_service, document_service


async def generate_flashcards(
    topic: str | None = None,
    document_id: str | None = None,
    num_cards: int = 10,
) -> list[dict]:
    """Generate flashcards from a topic string or uploaded document."""

    if document_id:
        source = document_service.get_document_text(document_id)
        if not source:
            raise ValueError(f"Document '{document_id}' not found.")
    elif topic:
        source = f"Topic: {topic}. Generate flashcards about this topic."
    else:
        raise ValueError("Provide either a topic or a document_id.")

    return await ai_service.generate_flashcards(source, num_cards)
