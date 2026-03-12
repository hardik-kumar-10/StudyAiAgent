"""
Document Service — handles PDF upload, text extraction, and storage.
"""

import uuid
import fitz  # PyMuPDF
from pathlib import Path
from backend.config import UPLOAD_DIR

# In-memory document store: { doc_id: { filename, path, text, pages } }
_documents: dict[str, dict] = {}


async def upload_document(filename: str, file_bytes: bytes) -> dict:
    """Save uploaded PDF and extract text."""
    doc_id = uuid.uuid4().hex[:12]
    file_path = UPLOAD_DIR / f"{doc_id}_{filename}"
    file_path.write_bytes(file_bytes)

    # Extract text from PDF
    text = ""
    num_pages = 0
    try:
        pdf = fitz.open(str(file_path))
        num_pages = len(pdf)
        for page in pdf:
            text += page.get_text() + "\n"
        pdf.close()
    except Exception as e:
        text = f"[Error extracting text: {e}]"

    doc_info = {
        "id": doc_id,
        "filename": filename,
        "path": str(file_path),
        "text": text.strip(),
        "pages": num_pages,
    }
    _documents[doc_id] = doc_info
    return doc_info


def get_document(doc_id: str) -> dict | None:
    """Retrieve a stored document by ID."""
    return _documents.get(doc_id)


def get_document_text(doc_id: str) -> str | None:
    """Get extracted text for a document."""
    doc = _documents.get(doc_id)
    return doc["text"] if doc else None


def list_documents() -> list[dict]:
    """List all uploaded documents (without full text)."""
    return [
        {
            "id": d["id"],
            "filename": d["filename"],
            "pages": d["pages"],
            "preview": d["text"][:200] + ("..." if len(d["text"]) > 200 else ""),
        }
        for d in _documents.values()
    ]
