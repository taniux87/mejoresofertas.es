// app.js - Versión Nativa (Mismo diseño, sin errores)

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const apiKeyInput = document.getElementById('api-key-input');
    const AMAZON_TAG = 'librarium01-21';

    // Elementos del chat
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const welcomeMessage = document.getElementById('welcome-message');

    // --- FUNCIÓN PARA PINTAR MENSAJES (Mismo diseño que React) ---
    function addMessage(text, sender, productLink = null) {
        // Ocultar bienvenida
        if (welcomeMessage) welcomeMessage.style.display = 'none';

        const wrapper = document.createElement('div');
        // Clases para alinear derecha/izquierda
        wrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} msg-enter`;

        const bubble = document.createElement('div');
        // AQUI ESTÁ LA MAGIA DEL DISEÑO:
        if (sender === 'user') {
            // Diseño Naranja para usuario (igual que antes)
            bubble.className = "max-w-[85%] p-4 rounded-2xl bg-orange-600 text-white rounded-tr-none shadow-md text-sm font-medium leading-relaxed";
        } else {
            // Diseño Blanco para IA (igual que antes)
            bubble.className = "max-w-[85%] p-4 rounded-2xl bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-md text-sm font-medium leading-relaxed";
        }
        
        bubble.innerText = text;

        // Si hay enlace, añadimos el BOTÓN AMARILLO
        if (productLink) {
            const btn = document.createElement('a');
            btn.href = productLink;
            btn.target = "_blank";
            // Clases del botón amarillo
            btn.className = "mt-4 block w-full bg-yellow-400 hover:bg-yellow-500 text-red-700 font-black py-3 rounded-xl text-center text-[10px] transition-all shadow-md uppercase tracking-tighter transform hover:scale-105 no-underline cursor-pointer";
            btn.innerText = "🎯 VER CHOLLAZOS EN AMAZON";
            bubble.appendChild(btn);
        }

        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        
        // Bajar scroll
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- CONEXIÓN CON LA IA ---
    async function fetchGemini(prompt) {
        typingIndicator.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        const apiKey = apiKeyInput.value;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Eres una experta en chollos. Responde breve y entusiasta. Pon el producto final entre corchetes dobles [[Producto]]. Usuario: " + prompt }] }]
                })
            });

            const data = await response.json();
            
            if (data.error) throw new Error(data.error.message);
            if (!data.candidates) throw new Error("Sin respuesta");

            let text = data.candidates[0].content.parts[0].text;
            let link = null;

            // Extraer producto [[...]]
            const match = text.match(/\[\[(.*?)\]\]/);
            if (match) {
                const product = match[1].trim();
                link = `https://www.amazon.es/s?k=${encodeURIComponent(product)}&tag=${AMAZON_TAG}`;
                text = text.replace(match[0], '');
            }

            addMessage(text, 'ai', link);

        } catch (err) {
            console.error(err);
            addMessage("Ups, hubo un error técnico. Inténtalo de nuevo.", 'ai');
        } finally {
            typingIndicator.classList.add('hidden');
        }
    }

    // --- EVENTOS ---
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
