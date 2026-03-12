/**
 * App Module — main orchestrator: routing, stats, global utilities.
 */
const App = (() => {
    const stats = {
        messagesSent: 0,
        docsUploaded: 0,
        quizzesTaken: 0,
        quizScores: [],
        flashcardsStudied: 0,
    };

    const activities = [];

    function init() {
        // Initialize modules
        Chat.init();
        Documents.init();
        Quiz.init();
        Flashcards.init();

        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                navigateTo(section);
            });
        });

        // Mobile menu
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar on nav click (mobile)
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        });

        updateDashboard();
    }

    function navigateTo(section) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`)?.classList.add('active');

        if (section === 'dashboard') updateDashboard();
    }

    function updateDashboard() {
        document.getElementById('stat-messages-value').textContent = stats.messagesSent;
        document.getElementById('stat-docs-value').textContent = stats.docsUploaded;
        document.getElementById('stat-quizzes-value').textContent = stats.quizzesTaken;
        document.getElementById('stat-flashcards-value').textContent = stats.flashcardsStudied;

        const avgScore = stats.quizScores.length > 0
            ? Math.round(stats.quizScores.reduce((a, b) => a + b, 0) / stats.quizScores.length) + '%'
            : '—';
        document.getElementById('stat-avg-score-value').textContent = avgScore;

        // Streak (simplified: count of total quiz attempts)
        document.getElementById('stat-streak-value').textContent = `🔥 ${stats.quizzesTaken}`;

        renderActivities();
    }

    function addActivity(icon, text) {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        activities.unshift({ icon, text, time });
        if (activities.length > 20) activities.pop();
        renderActivities();
    }

    function renderActivities() {
        const list = document.getElementById('activity-list');
        if (activities.length === 0) {
            list.innerHTML = `
                <div class="activity-empty">
                    <i class="fas fa-rocket"></i>
                    <p>Start studying to see your activity here!</p>
                </div>
            `;
            return;
        }
        list.innerHTML = activities.map(a => `
            <div class="activity-item">
                <i class="fas fa-${a.icon}"></i>
                <span>${a.text}</span>
                <span class="activity-time">${a.time}</span>
            </div>
        `).join('');
    }

    function showLoading(text = 'Generating...') {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    return { init, navigateTo, stats, updateDashboard, addActivity, showLoading, hideLoading };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
