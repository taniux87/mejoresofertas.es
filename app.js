// app.js
const { useState, useEffect, useRef } = React;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // ARREGLADO: Ahora la API Key tiene sus comillas para que funcione
  const [apiKey, setApiKey] = useState('AIzaSyCh-gSpjE17UGwanwtYr4oyY-Ntbqi63vI');
  const chatEndRef = useRef(null);

  const AMAZON_TAG = 'librarium01-21';

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

  const getGeminiResponse = async (prompt, retries = 0) => {
    const systemInstruction = `Eres la experta en chollos de MejoresOfertas.es. 
    Ayuda al usuario a encontrar productos en Amazon. 
    Responde siempre de forma entusiasta y breve. 
    SIEMPRE incluye al final el producto entre corchetes dobles: [[producto]].`;

    let chatHistory = [
      { role: "user", parts: [{ text: systemInstruction }] },
      { role: "model", parts: [{ text: "¡Hola! Soy tu asistente de chollos. ¿Qué buscamos hoy?" }] }
    ];

    messages.forEach(msg => {
      chatHistory.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: chatHistory })
      });

      const result = await response.json();
      let aiResponseText = result.candidates[0].content.parts[0].text;
      
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
      setMessages((prevMessages) => [...prevMessages, { text: 'Parece que hay un problema con la conexión. Revisa tu API Key.', sender: 'ai' }]);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Cabecera del Chat */}
      <header class="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-white flex justify-between items-center">
        <div>
          <h2 className="font-black text-lg tracking-tighter text-white">ASISTENTE IA</h2>
          <p className="text-xs opacity-80 text-white">Buscador de Chollos en Vivo</p>
        </div>
        <div className="flex flex-col items-end">
             <input
              type="password"
              placeholder="API Key"
              className="p-1 px-2 rounded bg-black bg-opacity-20 text-[10px] text-white placeholder-white focus:outline-none"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
        </div>
      </header>

      {/* Cuerpo del Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <span className="text-4xl mb-4 block">🤖</span>
            <p className="text-gray-500 font-medium">¿Qué te apetece comprar hoy a precio de chollo?</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              msg.sender === 'user' 
              ? 'bg-orange-600 text-white rounded-tr-none' 
              : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
              
              {msg.productLink && (
                <a 
                  href={msg.productLink} 
                  target="_blank" 
                  className="mt-4 block w-full bg-yellow-400 hover:bg-yellow-500 text-red-700 font-black py-3 rounded-xl text-center text-xs transition-all shadow-lg"
                >
                  🎯 VER CHOLLO EN AMAZON
                </a>
              )}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-orange-500 text-xs font-bold animate-bounce">La IA está rastreando Amazon...</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input de texto */}
      <div className="p-4 bg-white border-t flex items-center gap-2">
        <input
          type="text"
          className="flex-1 p-3 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          placeholder="Escribe un producto (ej: freidora de aire)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          onClick={handleSendMessage}
          className="bg-orange-600 p-3 rounded-2xl text-white hover:bg-red-700 transition-all shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
