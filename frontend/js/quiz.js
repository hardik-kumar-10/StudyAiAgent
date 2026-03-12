/**
 * Quiz Module — generates and runs interactive MCQ quizzes.
 */
const Quiz = (() => {
    let questions = [];
    let currentIdx = 0;
    let answers = {};  // { idx: selectedOption }
    let revealed = {};

    function init() {
        // Source toggle
        document.getElementById('quiz-source-topic').addEventListener('click', () => setSource('topic'));
        document.getElementById('quiz-source-document').addEventListener('click', () => setSource('document'));

        // Generate
        document.getElementById('quiz-generate').addEventListener('click', generate);

        // Nav
        document.getElementById('quiz-prev').addEventListener('click', () => navigate(-1));
        document.getElementById('quiz-next').addEventListener('click', () => navigate(1));
        document.getElementById('quiz-restart').addEventListener('click', restart);
    }

    function setSource(type) {
        document.getElementById('quiz-source-topic').classList.toggle('active', type === 'topic');
        document.getElementById('quiz-source-document').classList.toggle('active', type === 'document');
        document.getElementById('quiz-topic-group').style.display = type === 'topic' ? 'block' : 'none';
        document.getElementById('quiz-doc-group').style.display = type === 'document' ? 'block' : 'none';
    }

    async function generate() {
        const isTopicMode = document.getElementById('quiz-source-topic').classList.contains('active');
        const topic = document.getElementById('quiz-topic-input').value.trim();
        const docId = document.getElementById('quiz-doc-select').value;
        const numQ = parseInt(document.getElementById('quiz-num').value);
        const diff = document.getElementById('quiz-difficulty').value;

        if (isTopicMode && !topic) {
            alert('Please enter a topic.');
            return;
        }
        if (!isTopicMode && !docId) {
            alert('Please select a document.');
            return;
        }

        App.showLoading('Generating quiz questions...');

        try {
            const data = await API.generateQuiz({
                topic: isTopicMode ? topic : null,
                documentId: isTopicMode ? null : docId,
                numQuestions: numQ,
                difficulty: diff,
            });

            questions = data.questions;
            currentIdx = 0;
            answers = {};
            revealed = {};

            document.getElementById('quiz-setup').style.display = 'none';
            document.getElementById('quiz-active').style.display = 'block';
            document.getElementById('quiz-results').style.display = 'none';

            renderQuestion();
            App.hideLoading();
            App.addActivity('clipboard-question', `Started quiz: ${isTopicMode ? topic : 'From document'} (${numQ} Qs, ${diff})`);
        } catch (e) {
            App.hideLoading();
            alert('Error generating quiz: ' + e.message);
        }
    }

    function renderQuestion() {
        const q = questions[currentIdx];
        const card = document.getElementById('quiz-card');
        const letters = ['A', 'B', 'C', 'D'];
        const selected = answers[currentIdx];
        const isRevealed = revealed[currentIdx];

        card.innerHTML = `
            <div class="quiz-question">${q.question}</div>
            <div class="quiz-options">
                ${q.options.map((opt, i) => {
            let cls = 'quiz-option';
            if (isRevealed) {
                cls += ' disabled';
                if (i === q.correct) cls += ' correct';
                else if (i === selected && i !== q.correct) cls += ' wrong';
            } else if (i === selected) {
                cls += ' selected';
            }
            return `
                        <button class="${cls}" onclick="Quiz.selectOption(${i})">
                            <span class="option-letter">${letters[i]}</span>
                            <span>${opt}</span>
                        </button>
                    `;
        }).join('')}
            </div>
            <div class="quiz-explanation ${isRevealed ? 'show' : ''}" id="quiz-explanation">
                ${isRevealed ? `💡 ${q.explanation}` : ''}
            </div>
        `;

        // Update progress
        document.getElementById('quiz-counter').textContent = `Question ${currentIdx + 1} of ${questions.length}`;
        document.getElementById('quiz-progress-fill').style.width = `${((currentIdx + 1) / questions.length) * 100}%`;

        // Nav buttons
        document.getElementById('quiz-prev').disabled = currentIdx === 0;
        const nextBtn = document.getElementById('quiz-next');
        if (currentIdx === questions.length - 1) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Finish';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    }

    function selectOption(idx) {
        if (revealed[currentIdx]) return;

        answers[currentIdx] = idx;
        revealed[currentIdx] = true;
        renderQuestion();
    }

    function navigate(dir) {
        if (dir === 1 && currentIdx === questions.length - 1) {
            showResults();
            return;
        }
        currentIdx = Math.max(0, Math.min(questions.length - 1, currentIdx + dir));
        renderQuestion();
    }

    function showResults() {
        const correct = questions.filter((q, i) => answers[i] === q.correct).length;
        const pct = Math.round((correct / questions.length) * 100);

        document.getElementById('quiz-active').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'flex';

        // Animate score circle
        const fg = document.getElementById('results-fg');
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (pct / 100) * circumference;

        // Add gradient def if not exists
        const svg = fg.closest('svg');
        if (!svg.querySelector('#scoreGradient')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#7c3aed"/>
                    <stop offset="100%" stop-color="#c084fc"/>
                </linearGradient>
            `;
            svg.prepend(defs);
        }

        requestAnimationFrame(() => {
            fg.style.strokeDashoffset = offset;
        });

        document.getElementById('results-score').textContent = `${pct}%`;
        document.getElementById('results-subtitle').textContent = `You got ${correct} out of ${questions.length} correct`;

        if (pct >= 80) {
            document.getElementById('results-title').textContent = '🎉 Excellent!';
        } else if (pct >= 60) {
            document.getElementById('results-title').textContent = '👍 Good job!';
        } else if (pct >= 40) {
            document.getElementById('results-title').textContent = '📚 Keep practicing!';
        } else {
            document.getElementById('results-title').textContent = '💪 Don\'t give up!';
        }

        // Track stats
        App.stats.quizzesTaken++;
        App.stats.quizScores.push(pct);
        App.updateDashboard();
        App.addActivity('trophy', `Quiz completed: ${pct}% (${correct}/${questions.length})`);
    }

    function restart() {
        document.getElementById('quiz-setup').style.display = 'block';
        document.getElementById('quiz-active').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'none';

        // Reset circle
        document.getElementById('results-fg').style.strokeDashoffset = 283;
    }

    return { init, selectOption };
})();
