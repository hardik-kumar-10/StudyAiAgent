/**
 * API Client — wraps fetch calls to the StudyBuddy backend.
 */
const API = {
    BASE: '',

    async _request(url, options = {}) {
        try {
            const res = await fetch(this.BASE + url, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: res.statusText }));
                throw new Error(err.detail || 'Request failed');
            }
            return await res.json();
        } catch (e) {
            console.error(`API error [${url}]:`, e);
            throw e;
        }
    },

    // Chat
    chat(message, history = [], documentId = null) {
        return this._request('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message, history, document_id: documentId }),
        });
    },

    // Documents
    async uploadDocument(file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(this.BASE + '/api/upload', {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Upload failed');
        }
        return await res.json();
    },

    listDocuments() {
        return this._request('/api/documents');
    },

    summarize(documentId, maxPoints = 10) {
        return this._request('/api/summarize', {
            method: 'POST',
            body: JSON.stringify({ document_id: documentId, max_points: maxPoints }),
        });
    },

    // Explain
    explain(topic, depth = 'medium') {
        return this._request('/api/explain', {
            method: 'POST',
            body: JSON.stringify({ topic, depth }),
        });
    },

    // Quiz
    generateQuiz({ topic, documentId, numQuestions = 5, difficulty = 'medium' }) {
        return this._request('/api/quiz/generate', {
            method: 'POST',
            body: JSON.stringify({
                topic: topic || null,
                document_id: documentId || null,
                num_questions: numQuestions,
                difficulty,
            }),
        });
    },

    // Flashcards
    generateFlashcards({ topic, documentId, numCards = 10 }) {
        return this._request('/api/flashcards/generate', {
            method: 'POST',
            body: JSON.stringify({
                topic: topic || null,
                document_id: documentId || null,
                num_cards: numCards,
            }),
        });
    },
};
