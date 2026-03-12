/**
 * Documents Module — handles PDF upload and document management.
 */
const Documents = (() => {
    let documents = [];

    function init() {
        const zone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');

        zone.addEventListener('click', () => fileInput.click());

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) uploadFile(file);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) uploadFile(file);
            fileInput.value = '';
        });

        // Load existing docs
        loadDocuments();
    }

    async function loadDocuments() {
        try {
            documents = await API.listDocuments();
            renderDocuments();
            updateDocSelectors();
        } catch (e) {
            // Server might not be running yet
        }
    }

    async function uploadFile(file) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please upload a PDF file.');
            return;
        }

        const progressEl = document.getElementById('upload-progress');
        const fillEl = document.getElementById('progress-fill');
        const textEl = document.getElementById('progress-text');

        progressEl.style.display = 'block';
        fillEl.style.width = '30%';
        textEl.textContent = 'Uploading...';

        try {
            fillEl.style.width = '60%';
            textEl.textContent = 'Extracting text...';

            const doc = await API.uploadDocument(file);

            fillEl.style.width = '100%';
            textEl.textContent = 'Done!';

            documents.push(doc);
            renderDocuments();
            updateDocSelectors();

            App.stats.docsUploaded++;
            App.updateDashboard();
            App.addActivity('file-pdf', `Uploaded: ${doc.filename}`);

            setTimeout(() => {
                progressEl.style.display = 'none';
                fillEl.style.width = '0%';
            }, 1500);
        } catch (e) {
            fillEl.style.width = '0%';
            textEl.textContent = `Error: ${e.message}`;
            setTimeout(() => { progressEl.style.display = 'none'; }, 3000);
        }
    }

    function renderDocuments() {
        const list = document.getElementById('documents-list');
        if (documents.length === 0) {
            list.innerHTML = '';
            return;
        }

        list.innerHTML = documents.map(doc => `
            <div class="doc-card" data-id="${doc.id}">
                <div class="doc-icon"><i class="fas fa-file-pdf"></i></div>
                <div class="doc-info">
                    <div class="doc-name">${doc.filename}</div>
                    <div class="doc-meta">${doc.pages} pages</div>
                </div>
                <div class="doc-actions">
                    <button class="doc-action-btn" onclick="Documents.summarize('${doc.id}')">
                        <i class="fas fa-align-left"></i> Summarize
                    </button>
                    <button class="doc-action-btn" onclick="Documents.useAsContext('${doc.id}', '${doc.filename}')">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                </div>
            </div>
        `).join('');
    }

    function updateDocSelectors() {
        const quizSelect = document.getElementById('quiz-doc-select');
        const fcSelect = document.getElementById('fc-doc-select');

        const optionsHtml = documents.length === 0
            ? '<option value="">Upload a document first</option>'
            : documents.map(d => `<option value="${d.id}">${d.filename}</option>`).join('');

        quizSelect.innerHTML = optionsHtml;
        fcSelect.innerHTML = optionsHtml;
    }

    async function summarize(docId) {
        App.showLoading('Summarizing document...');
        try {
            const data = await API.summarize(docId);
            App.hideLoading();

            // Navigate to chat & show summary
            App.navigateTo('chat');
            const doc = documents.find(d => d.id === docId);
            Chat.setContext(docId, doc?.filename || 'Document');
            Chat.appendMessage?.('assistant', `📄 **Document Summary:**\n\n${data.summary}`);

            // Fallback: put summary in chat manually
            const messagesEl = document.getElementById('chat-messages');
            const div = document.createElement('div');
            div.className = 'message assistant';
            div.innerHTML = `
                <div class="message-avatar"><i class="fas fa-brain"></i></div>
                <div class="message-bubble">
                    <p>📄 <strong>Document Summary:</strong></p>
                    ${data.summary.replace(/\n/g, '<br>')}
                </div>
            `;
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;

            App.addActivity('align-left', `Summarized: ${doc?.filename || 'document'}`);
        } catch (e) {
            App.hideLoading();
            alert('Error summarizing: ' + e.message);
        }
    }

    function useAsContext(docId, docName) {
        Chat.setContext(docId, docName);
        App.navigateTo('chat');
    }

    function getDocuments() { return documents; }

    return { init, loadDocuments, summarize, useAsContext, getDocuments, updateDocSelectors };
})();
