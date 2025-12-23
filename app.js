// app.js - VERSIÓN FINAL (Botones Amarillos + Modelo Flash)

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
        div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`;

        const bubble = document.createElement('div');
        
        // ESTILOS: NARANJA (Tú) vs BLANCO (IA)
        if (sender === 'user') {
            bubble.className = "bg-orange-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg max-w-[85%] text-sm font-medium";
        } else {
            bubble.className = "bg-white border border-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none shadow-lg max-w-[85%] text-sm font-medium";
        }
        
        bubble.innerText = text;

        // BOTÓN "TIPO OFERTA" (Amarillo y Rojo)
        if (link) {
            const btn = document.createElement('a');
            btn.href = link;
            btn.target = "_blank";
            // Aquí recuperamos tu estilo favorito:
            btn.className = "mt-4 block w-full bg-yellow-400 hover:bg-yellow-500 text-red-700 font-black py-3 rounded-xl text-center text-[10px] transition-all shadow-md uppercase tracking-tighter transform hover:scale-105 no-underline cursor-pointer border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1";
            btn.innerText = "🎯 VER CHOLLAZO EN AMAZON";
            bubble.appendChild(btn);
        }

        div.appendChild(bubble);
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // 2. CONEXIÓN CON LA IA
    async function askGemini(prompt) {
        loading.classList.remove('hidden');

        // URL CORRECTA: Usamos 'gemini-1.5-flash' en 'v1beta'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ 
                        parts: [{ 
                            text: "Eres una experta en chollos. Responde muy breve y alegre. Si el usuario pide un producto, escribe su nombre al final entre corchetes dobles, así: [[Zapatillas Nike]]. Usuario dice: " + prompt 
                        }] 
                    }]
                })
            });

            const data = await response.json();

            // Si Google da error (ej: 404), lanzamos aviso
            if (data.error) throw new Error(data.error.message);
            
            let reply = data.candidates[0].content.parts[0].text;
            let amazonLink = null;

            // BUSCAR EL PRODUCTO [[...]]
            const match = reply.match(/\[\[(.*?)\]\]/);
            if (match) {
                const product = match[1];
                amazonLink = `https://www.amazon.es/s?k=${encodeURIComponent(product)}&tag=${AMAZON_TAG}`;
                reply = reply.replace(match[0], '');
            }

            addMessage(reply, 'ai', amazonLink);

        } catch (error) {
            console.error("Error API:", error);
            // Mensaje amigable si falla
            addMessage("Ups, mi cerebro está echando humo. Inténtalo de nuevo (o revisa si la API Key tiene permisos).", 'ai');
        } finally {
            loading.classList.add('hidden');
        }
    }

    // 3. EVENTOS
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
