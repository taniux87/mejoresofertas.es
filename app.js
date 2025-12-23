// app.js
const { useState, useEffect, useRef } = React;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Tu API Key con comillas
  const [apiKey, setApiKey] = useState('AIzaSyCh-gSpjE17UGwanwtYr4oyY-Ntbqi63vI');
  const chatEndRef = useRef(null);

  // Tu ID de afiliado de Amazon
  const AMAZON_TAG = 'librarium01-21';

  // Efecto para que el chat siempre baje solo
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsTyping(true);

    await getGeminiResponse(input);
    setIsTyping(false);
  };

  const getGeminiResponse = async (prompt) => {
    // Instrucciones para que la IA sepa qué hacer
    const systemInstruction = "Eres la experta en chollos de MejoresOfertas.es. Ayuda al usuario a encontrar productos en Amazon. Responde siempre de forma entusiasta y breve. SIEMPRE incluye al final el producto entre corchetes dobles: [[producto]].";

    // Preparamos el envío para la versión V1 estable
    const payload = {
      contents: [{
        parts: [{ text: systemInstruction + "\n\nUsuario: " + prompt }]
      }]
    };

    // LÍNEA 45 ARREGLADA (Con su comilla de cierre)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      // LÍNEA 47 ARREGLADA: Ahora apiUrl está definida correctamente arriba
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // Si Google responde con un error, lo mostramos en el chat
      if (result.error) {
        throw new Error(result.error.message);
      }

      let aiResponseText = result.candidates[0].content.parts[0].text;
      
      // Buscamos si hay un producto entre corchetes para crear el botón
      const productMatch = aiResponseText.match(/\[\[(.*?)\]\]/);
      let pLink = null;
      if (productMatch) {
        const productFound = productMatch[1].trim();
        pLink = `https://www.amazon.es/s?k=${encodeURIComponent(productFound)}&tag=${AMAZON_TAG}`;
        aiResponseText = aiResponseText.replace(`[[${productFound}]]`, '');
      }

      setMessages((prevMessages) => [...prevMessages, { 
        text: aiResponseText, 
        sender: 'ai',
        productLink: pLink 
      }]);

    } catch (error) {
      console.error("Detalle del error:", error);
      setMessages((prevMessages) => [...prevMessages, { 
        text: `Error: ${error.message}. Revisa que tu clave no tenga restricciones en Google Cloud.`, 
        sender: 'ai' 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Cabecera del Chat */}
      <header className="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-white flex justify-between items-center shadow-lg">
        <div>
          <h2 className="font-black text-lg tracking-tighter uppercase">Asistente IA</h2>
          <p className="text-[10px] opacity-90 font-bold uppercase tracking-widest">MejoresOfertas.es</p>
        </div>
        <input
          type="password"
          className="p-1 px-2 rounded bg-white bg-opacity-20 text-[10px] text-white placeholder-white focus:outline-none border border-white border-opacity-30"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </header>

      {/* Cuerpo del Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-60">
            <span className="text-5xl mb-4 block">🤖</span>
            <p className="text-gray-600 font-bold uppercase text-xs tracking-widest">¿Qué chollo buscamos hoy?</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-md ${
              msg.sender === 'user' 
              ? 'bg-orange-600 text-white rounded-tr-none' 
              : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              {msg.productLink && (
                <a 
                  href={msg.productLink} 
                  target="_blank" 
                  className="mt-4 block w-full bg-yellow-400 hover:bg-yellow-500 text-red-700 font-black py-3 rounded-xl text-center text-[10px] transition-all shadow-md uppercase tracking-tighter"
                >
                  🎯 Ver Chollazos en Amazon
                </a>
              )}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-orange-500 text-[10px] font-black animate-pulse uppercase ml-2 italic">Rastreando Amazon...</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input de texto */}
      <div className="p-4 bg-white border-t flex items-center gap-2">
        <input
          type="text"
          className="flex-1 p-3 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
          placeholder="Escribe aquí (ej: zapatillas Nike)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          onClick={handleSendMessage}
          className="bg-orange-600 p-3 rounded-2xl text-white hover:bg-red-700 transition-all shadow-lg active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
