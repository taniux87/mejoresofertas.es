// app.js – FRONTEND SEGURO (sin API key)

document.addEventListener('DOMContentLoaded', () => {

    const AMAZON_TAG = 'librarium01-21';

    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const loading = document.getElementById('loading');
    const welcomeMsg = document.getElementById('welcome-msg');

    function addMessage(text, sender, link = null) {
        if (welcomeMsg) welcomeMsg.style.display = 'none';

        const div = document.createElement('div');
        div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`;

        const bubble = document.createElement('div');

        if (sender === 'user') {
            bubble.className =
                "bg-orange-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg max-w-[85%] text-sm font-medium";
        } else {
            bubble.className =
                "bg-white border border-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none shadow-lg max-w-[85%] text-sm font-medium";
        }

        bubble.innerText = text;

        if (link) {
            const btn = document.createElement('a');
            btn.href = link;
            btn.target = "_blank";
            btn.className =
                "mt-4 block w-full bg-yellow-400 hover:bg-yellow-500 text-red-700 font-black py-3 rounded-xl text-center text-[10px] uppercase shadow-md transform hover:scale-105 no-underline";
            btn.innerText = "🎯 VER CHOLLAZO EN AMAZON";
            bubble.appendChild(btn);
        }

        div.appendChild(bubble);
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function askBot(prompt) {
        loading.classList.remove('hidden');

        try {
            const res = await fetch("https://TU_BACKEND_AQUI/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            let reply = data.text;
            let amazonLink = null;

            const match = reply.match(/\[\[(.*?)\]\]/);
            if (match) {
                const product = match[1];
                amazonLink =
                    `https://www.amazon.es/s?k=${encodeURIComponent(product)}&tag=${AMAZON_TAG}`;
                reply = reply.replace(match[0], '').trim();
            }

            addMessage(reply, 'ai', amazonLink);

        } catch (e) {
            console.error(e);
            addMessage(
                "Ups, ahora mismo no puedo pensar 🤯 Inténtalo en unos segundos.",
                'ai'
            );
        } finally {
            loading.classList.add('hidden');
        }
    }

    function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        userInput.value = '';
        askBot(text);
    }

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSend();
    });
});
