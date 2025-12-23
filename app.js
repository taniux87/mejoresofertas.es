// app.js - Versión Robusta (Nativa)

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const apiKeyInput = document.getElementById('api-key-input');
    // Si la clave falla mucho, considera generar una nueva en Google AI Studio
    const AMAZON_TAG = 'librarium01-21';

    // Elementos del chat
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const welcomeMessage = document.getElementById('welcome-message');

    // --- 1. PINTAR MENSAJES (ESTILO WHATSAPP) ---
    function addMessage(text, sender, productLink = null) {
        if (welcomeMessage) welcomeMessage.style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} msg-enter`;

        const bubble = document.createElement('div');
        if (sender === 'user') {
            bubble.className = "max-w-[85%] p-4 rounded-2xl bg-orange-600 text-white rounded-tr-none shadow-md text-sm font-medium leading-relaxed";
        } else {
            bubble.className = "max-w-[85%] p-4 rounded-2xl bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-md text-sm font-medium leading-relaxed";
        }
        
        bubble.innerText = text;

        // BOTÓN DE AMAZON
        if (productLink) {
            const btn = document.createElement('a');
            btn.href = productLink;
            btn.target = "_blank";
            btn.className = "mt-4 block w-full bg-yellow-400 hover:bg-yellow-500 text-red-700 font-black py-3 rounded-xl text-center text-[10px] transition-all shadow-md uppercase tracking-tighter transform hover:scale-105 no-underline cursor-pointer";
            btn.innerText = "🎯 VER CHOLLO EN AMAZON";
            bubble.appendChild(btn);
        }

        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- 2. CONEXIÓN CON LA IA (GOOGLE GEMINI) ---
    async function fetchGemini(prompt) {
        typingIndicator.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        const apiKey = apiKeyInput.value.trim();
        // Usamos v1beta que es más compatible con Flash
        const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";
        
        // Instrucciones para la IA
        const payload = {
            contents: [{ parts: [{ text: "Eres una experta en chollos. Responde muy breve y simpática. Pon el producto final a buscar entre corchetes dobles [[Producto]]. Usuario: " + prompt }] }]
        };

        try {
            // INTENTO 1: Modelo Rápido (Flash)
            let response = await fetch(`${baseUrl}gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Si falla Flash, intentamos el Plan B (Modelo Pro Clásico)
            if (!response.ok) {
                console.warn("Flash falló, intentando modelo Pro...");
                response = await fetch(`${baseUrl}gemini-pro:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await response.json();

            if (data.error) throw new Error(data.error.message);
            if (!data.candidates) throw new Error("Sin respuesta");

            let text = data.candidates[0].content.parts[0].text;
            let link = null;

            // Extraer [[Producto]]
            const match = text.match(/\[\[(.*?)\]\]/);
            if (match) {
                const product = match[1].trim();
                link = `https://www.amazon.es/s?k=${encodeURIComponent(product)}&tag=${AMAZON_TAG}`;
                text = text.replace(match[0], '');
            }

            addMessage(text, 'ai', link);

        } catch (err) {
            console.error(err);
            addMessage("Ups, mi cerebro está echando humo. Revisa tu API Key o inténtalo de nuevo.", 'ai');
        } finally {
            typingIndicator.classList.add('hidden');
        }
    }

    // --- 3. EVENTOS ---
    function send() {
        const text = userInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        userInput.value = '';
        fetchGemini(text);
    }

    sendBtn.addEventListener('click', send);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') send();
    });
});
