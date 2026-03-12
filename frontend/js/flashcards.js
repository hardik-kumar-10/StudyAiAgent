/**
 * Flashcards Module — generates and displays flip-style flashcards.
 */
const Flashcards = (() => {
    let cards = [];
    let currentIdx = 0;

    function init() {
        // Source toggle
        document.getElementById('fc-source-topic').addEventListener('click', () => setSource('topic'));
        document.getElementById('fc-source-document').addEventListener('click', () => setSource('document'));

        // Generate
        document.getElementById('fc-generate').addEventListener('click', generate);

        // Navigation
        document.getElementById('fc-prev').addEventListener('click', () => navigate(-1));
        document.getElementById('fc-next').addEventListener('click', () => navigate(1));
        document.getElementById('fc-shuffle').addEventListener('click', shuffle);
        document.getElementById('fc-back-setup').addEventListener('click', backToSetup);

        // Flip card
        document.getElementById('flashcard').addEventListener('click', flip);
    }

    function setSource(type) {
        document.getElementById('fc-source-topic').classList.toggle('active', type === 'topic');
        document.getElementById('fc-source-document').classList.toggle('active', type === 'document');
        document.getElementById('fc-topic-group').style.display = type === 'topic' ? 'block' : 'none';
        document.getElementById('fc-doc-group').style.display = type === 'document' ? 'block' : 'none';
    }

    async function generate() {
        const isTopicMode = document.getElementById('fc-source-topic').classList.contains('active');
        const topic = document.getElementById('fc-topic-input').value.trim();
        const docId = document.getElementById('fc-doc-select').value;
        const numCards = parseInt(document.getElementById('fc-num').value);

        if (isTopicMode && !topic) {
            alert('Please enter a topic.');
            return;
        }
        if (!isTopicMode && !docId) {
            alert('Please select a document.');
            return;
        }

        App.showLoading('Generating flashcards...');

        try {
            const data = await API.generateFlashcards({
                topic: isTopicMode ? topic : null,
                documentId: isTopicMode ? null : docId,
                numCards,
            });

            cards = data.cards;
            currentIdx = 0;

            document.getElementById('flashcard-setup').style.display = 'none';
            document.getElementById('flashcard-viewer').style.display = 'flex';

            renderCard();
            App.hideLoading();

            App.stats.flashcardsStudied += cards.length;
            App.updateDashboard();
            App.addActivity('layer-group', `Generated ${cards.length} flashcards: ${isTopicMode ? topic : 'From document'}`);
        } catch (e) {
            App.hideLoading();
            alert('Error generating flashcards: ' + e.message);
        }
    }

    function renderCard() {
        const card = cards[currentIdx];
        document.getElementById('fc-front-content').textContent = card.term;
        document.getElementById('fc-back-content').textContent = card.definition;
        document.getElementById('fc-example').textContent = card.example ? `📌 ${card.example}` : '';
        document.getElementById('fc-counter').textContent = `Card ${currentIdx + 1} of ${cards.length}`;

        // Remove flip state
        document.getElementById('flashcard').classList.remove('flipped');
    }

    function flip() {
        document.getElementById('flashcard').classList.toggle('flipped');
    }

    function navigate(dir) {
        currentIdx = (currentIdx + dir + cards.length) % cards.length;
        renderCard();
    }

    function shuffle() {
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        currentIdx = 0;
        renderCard();
    }

    function backToSetup() {
        document.getElementById('flashcard-setup').style.display = 'block';
        document.getElementById('flashcard-viewer').style.display = 'none';
    }

    return { init };
})();
