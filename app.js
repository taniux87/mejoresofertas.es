// app.js
const { useState, useEffect, useRef } = React; // Importar React hooks

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState(AIzaSyCh-gSpjE17UGwanwtYr4oyY-Ntbqi63vI); 
  const chatEndRef = useRef(null);

  // Tu ID de afiliado de Amazon
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
    // INSTRUCCIÓN DEL SISTEMA para la IA
    const systemInstruction = `Eres un experto en chollos y ofertas de MejoresOfertas.es. 
    Tu objetivo es ayudar al usuario a encontrar productos y ofertas en Amazon. 
    Si el usuario busca un producto o categoría, respóndele con un mensaje breve y amigable. 
    Al final de tu respuesta, SIEMPRE incluye el nombre del producto o la frase de búsqueda entre corchetes dobles, así: [[nombre del producto o búsqueda]].
    Por ejemplo, si buscan "freidora de aire", tu respuesta podría ser: "¡Claro! He buscado las mejores freidoras de aire para ti. [[freidora de aire]]".
    Si no te piden un producto específico, puedes preguntarles qué buscan o dar un consejo general.`;

    let chatHistory = [
      { role: "user", parts: [{ text: systemInstruction }] },
      { role: "model", parts: [{ text: "Entendido, soy el asistente de MejoresOfertas.es y te ayudaré a buscar ofertas con el formato [[producto]]." }] }
    ];

    messages.forEach(msg => {
      chatHistory.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    // MODELO ESTABLE: gemini-1.5-flash
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: chatHistory })
      });

      if (!response.ok) {
        if (response.status === 429 && retries < 5) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return getGeminiResponse(prompt, retries + 1);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      let aiResponseText = 'No pude obtener una respuesta. Intenta de nuevo.';
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        aiResponseText = result.candidates[0].content.parts[0].text;
      }
      
      const productMatch = aiResponseText.match(/\[\[(.*?)\]\]/);
      let productFound = null;
      if (productMatch) {
        productFound = productMatch[1].trim();
        // Construye el enlace de Amazon con tu afiliado
        productLink = `https://www.amazon.es/s?k=${encodeURIComponent(productFound)}&tag=${AMAZON_TAG}`;
        aiResponseText = aiResponseText.replace(`[[${productFound}]]`, ''); // Elimina los corchetes de la respuesta final
      }

      setMessages((prevMessages) => [...prevMessages, { 
        text: aiResponseText, 
        sender: 'ai',
        productLink: productLink 
      }]);

    } catch (error) {
      console.error("Error fetching from Gemini API:", error);
      setMessages((prevMessages) => [...prevMessages, { text: 'Lo siento, hubo un error al conectar con la IA.', sender: 'ai' }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-t-lg shadow-sm flex items-center justify-between">
        <h2 className="text-lg font-bold">Tu Asistente de Chollos</h2>
        <input
          type="password" // Esto lo oculta en pantalla, pero si quieres que sea visible, cambia a "text"
          placeholder="Tu API Key de Gemini"
          className="p-1 px-2 rounded-md text-xs text-gray-800 bg-white bg-opacity-80 focus:outline-none focus:ring-1 focus:ring-yellow-300"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96"> {/* Altura máxima para el chat */}
        {messages.length === 0 && !isTyping && (
          <div className="text-center text-gray-500 mt-5">
            <p className="text-md">¡Hola! Soy tu asistente de MejoresOfertas.es.</p>
            <p className="text-sm">Pregúntame por cualquier producto y te buscaré ofertas.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm break-words">{msg.text}</p>
              
              {/* Botón de Enlace a Amazon */}
              {msg.productLink && (
                <a 
                  href={msg.productLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 inline-block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md"
                >
                  Ver ofertas en Amazon
                </a>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs p-3 rounded-xl bg-gray-200 text-gray-800 shadow-sm animate-pulse">
              <p className="text-sm">La IA está buscando ofertas...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-gray-100 border-t border-gray-200 flex items-center space-x-3 rounded-b-lg">
        <input
          type="text"
          className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
          placeholder="¿Qué chollo buscas hoy?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          disabled={isTyping}
        />
        <button
          className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSendMessage}
          disabled={isTyping || input.trim() === ''}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
