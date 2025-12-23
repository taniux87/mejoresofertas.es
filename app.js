// app.js - CÓDIGO NATIVO (Sin React, Sin Babel)

document.addEventListener('DOMContentLoaded', () => {

    // TU CLAVE Y TU TAG
    const API_KEY = 'AIzaSyCh-gSpjE17UGwanwtYr4oyY-Ntbqi63vI'; 
    const AMAZON_TAG = 'librarium01-21';

    // ELEMENTOS
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const loading = document.getElementById('loading');
    const welcomeMsg = document.getElementById('welcome-msg');

    // 1. FUNCIÓN AÑADIR MENSAJE
    function addMessage(text, sender, link = null) {
        if(welcomeMsg) welcomeMsg.style.display = 'none';

        const div = document.createElement('div');
        div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

        const bubble = document.createElement('div');
        // Estilos condicionales
        if (sender === 'user') {
            bubble.className = "bg-orange-600 text-white p-3 rounded-2xl rounded-tr-none shadow max-w-[85%]";
        } else {
            bubble.className = "bg-white border text-gray-800 p-3 rounded-2xl rounded-tl-none shadow max-w-[85%]";
        }
        
        bubble.innerText = text;

        if (link) {
            const btn = document.createElement('a');
            btn.href = link;
            btn.target = "_blank";
            btn.className = "mt-3 block bg-yellow-400 text-red-900 font-bold py-2 px-4 rounded text-center text-xs uppercase shadow no-underline hover:bg-yellow-500";
            btn.innerText = "VER EN AMAZON";
            bubble.appendChild(btn);
        }

        div.appendChild(bubble);
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // 2. FUNCIÓN LLAMAR A GOOGLE
    async function askGemini(prompt) {
        loading.classList.remove('hidden');

        // CAMBIO CLAVE: Usamos 'gemini-pro' para evitar el error 404
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Eres experta en compras. Responde breve. Finaliza con [[Producto]]. Usuario: " + prompt }] }]
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error.message);
            
            let reply = data.candidates[0].content.parts[0].text;
            let amazonLink = null;

            // Detectar [[Producto]]
            const match = reply.match(/\[\[(.*?)\]\]/);
            if (match) {
                const product = match[1];
                amazonLink = `https://www.amazon.es/s?k=${encodeURIComponent(product)}&tag=${AMAZON_TAG}`;
                reply = reply.replace(match[0], '');
            }

            addMessage(reply, 'ai', amazonLink);

        } catch (error) {
            console.error(error);
            addMessage("Error de conexión. Intenta de nuevo.", 'ai');
        } finally {
            loading.classList.add('hidden');
        }
    }

    // 3. BOTONES
    function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        userInput.value = '';
        askGemini(text);
    }

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
