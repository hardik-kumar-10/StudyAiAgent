/**
 * Chat Module — handles the AI tutor chat interface.
 */
const Chat = (() => {
    let history = [];
    let contextDocId = null;
    let contextDocName = null;

    const messagesEl = () => document.getElementById('chat-messages');
    const inputEl = () => document.getElementById('chat-input');

    function init() {
        const sendBtn = document.getElementById('chat-send');
        const input = inputEl();

        sendBtn.addEventListener('click', send);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });

        // Context bar remove
        document.getElementById('chat-context-remove').addEventListener('click', clearContext);
    }

    function setContext(docId, docName) {
        contextDocId = docId;
        contextDocName = docName;
        const bar = document.getElementById('chat-context-bar');
        document.getElementById('chat-context-name').textContent = `Context: ${docName}`;
        bar.style.display = 'flex';
    }

    function clearContext() {
        contextDocId = null;
        contextDocName = null;
        document.getElementById('chat-context-bar').style.display = 'none';
    }

    async function send() {
        const input = inputEl();
        const msg = input.value.trim();
        if (!msg) return;

        input.value = '';
        input.style.height = 'auto';

        // Render user message
        appendMessage('user', msg);
        history.push({ role: 'user', content: msg });
        App.stats.messagesSent++;
        App.updateDashboard();
        App.addActivity('comments', `Asked: "${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}"`);

        // Show typing indicator
        const typingEl = showTyping();

        try {
            const data = await API.chat(msg, history, contextDocId);
            removeTyping(typingEl);
            appendMessage('assistant', data.reply);
            history.push({ role: 'assistant', content: data.reply });
        } catch (err) {
            removeTyping(typingEl);
            appendMessage('assistant', `⚠️ Sorry, something went wrong: ${err.message}`);
        }
    }

    function appendMessage(role, content) {
        const container = messagesEl();
        const div = document.createElement('div');
        div.className = `message ${role}`;

        const icon = role === 'assistant' ? 'fa-brain' : 'fa-user';
        div.innerHTML = `
            <div class="message-avatar"><i class="fas ${icon}"></i></div>
            <div class="message-bubble">${renderMarkdown(content)}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function renderMarkdown(text) {
        // Simple markdown: bold, italic, code, lists, paragraphs
        let html = text
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^## (.+)$/gm, '<h3>$1</h3>')
            .replace(/^# (.+)$/gm, '<h2>$1</h2>')
            .replace(/^\- (.+)$/gm, '<li>$1</li>')
            .replace(/^\* (.+)$/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // Wrap consecutive <li> in <ul>
        html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

        // Wrap remaining lines in <p>
        html = html.split('\n\n').map(block => {
            if (block.startsWith('<')) return block;
            return `<p>${block.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        return html;
    }

    function showTyping() {
        const container = messagesEl();
        const div = document.createElement('div');
        div.className = 'message assistant typing';
        div.innerHTML = `
            <div class="message-avatar"><i class="fas fa-brain"></i></div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    function removeTyping(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    return { init, setContext, clearContext, send };
})();
