// app.js - CÓDIGO COMPLETO Y CORREGIDO
const { useState, useEffect, useRef } = React;

function App() {
  // Estado para los mensajes del chat
  const [messages, setMessages] = useState([]);
  // Estado para lo que escribe el usuario
  const [input, setInput] = useState('');
  // Estado para saber si la IA está "pensando"
  const [isTyping, setIsTyping] = useState(false);
  
  // Tu API Key de Google (Asegúrate de que no haya espacios extra)
  const [apiKey, setApiKey] = useState('AIzaSyCh-gSpjE17UGwanwtYr4oyY-Ntbqi63vI');
  
  // Referencia para el scroll automático
  const chatEndRef = useRef(null);

  // Tu ID de afiliado de Amazon para ganar comisiones
  const AMAZON_TAG = 'librarium01-21';

  // Efecto: Cada vez que hay un mensaje nuevo, baja el scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Función para manejar el envío del mensaje del usuario
  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    // Añadimos el mensaje del usuario al chat
    const userMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    // Limpiamos el input y ponemos a la IA a "pensar"
    setInput('');
    setIsTyping(true);

    // Llamamos a la función que conecta con Google
    await getGeminiResponse(input);
    
    // La IA termina de pensar
    setIsTyping(false);
  };

  // Función principal: Conectar con la IA de Google (Gemini)
  const getGeminiResponse = async (prompt) => {
    // 1. Instrucciones para que la IA sepa comportarse
    const systemInstruction = "Eres la experta en chollos de MejoresOfertas.es. Ayuda al usuario a encontrar productos en Amazon. Responde siempre de forma entusiasta, breve y persuasiva. SIEMPRE incluye al final el nombre exacto del producto para buscar entre corchetes dobles, por ejemplo: [[Zapatillas Nike Running]].";

    // 2. Preparamos los datos tal como los pide Google ahora
    const payload = {
      contents: [{
        parts: [{ text: systemInstruction + "\n\nUsuario dice: " + prompt }]
      }]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      // Hacemos la petición a Google
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // Si Google nos devuelve un error, lo capturamos
      if (result.error) {
        throw new Error(result.error.message || "Error desconocido de la API");
      }

      // Si no hay respuesta válida
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error("La IA no ha devuelto ninguna respuesta.");
      }

      // 4. Procesamos el texto de la IA
      let aiResponseText = result.candidates[0].content.parts[0].text;
      
      // Buscamos si la IA nos ha dado un producto entre [[ ]]
      const productMatch = aiResponseText.match(/\[\[(.*?)\]\]/);
      let pLink = null;
      
      if (productMatch) {
        const productFound = productMatch[1].trim();
        // Creamos el enlace de afiliado de Amazon
        pLink = `https://www.amazon.es/s?k=${encodeURIComponent(productFound)}&tag=${AMAZON_TAG}`;
        // Quitamos los corchetes del texto que ve el usuario para que quede bonito
        aiResponseText = aiResponseText.replace(`[[${productFound}]]`, '');
      }

      setMessages((prevMessages) => [...prevMessages, { 
        text: aiResponseText, 
        sender: 'ai',
        productLink: pLink 
      }]);

    } catch (error) {
      console.error("Detalle del error:", error);
      // Mostramos el error en el chat para que sepas qué pasa
      setMessages((prevMessages) => [...prevMessages, { 
        text: `Lo siento, hubo un error técnico: ${error.message}. Verifica tu conexión o la API Key.`, 
        sender: 'ai' 
      }]);
    }
  };

   return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 font-sans">
      
      {/* Cabecera del Chat */}
      <header className="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-white flex justify-between items-center shadow-lg">
        <div>
          <h2 className="font-black text-lg tracking-tighter uppercase">Asistente IA</h2>
          <p className="text-[10px] opacity-90 font-bold uppercase tracking-widest">MejoresOfertas.es</p>
        </div>
        {/* Input pequeño para cambiar la API Key si hace falta */}
        <input
          type="password"
          className="p-1 px-2 rounded bg-white bg-opacity-20 text-[10px] text-white placeholder-white focus:outline-none border border-white border-opacity-30 w-24 transition-all focus:w-48"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key..."
        />
      </header>

      {/* Cuerpo del Chat (Mensajes) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        
        {/* Mensaje de bienvenida si el chat está vacío */}
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-60">
            <span className="text-5xl mb-4 block animate-bounce">🤖</span>
            <p className="text-gray-600 font-bold uppercase text-xs tracking-widest">¿Qué chollo buscamos hoy?</p>
          </div>
        )}

        {/* Mapeo de mensajes */}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-md transition-all duration-200 ${
              msg.sender === 'user' 
              ? 'bg-orange-600 text-white rounded-tr-none' 
              : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              
              {/* Botón de Producto (si la IA encontró uno) */}
              {msg.productLink && (
                <a 
                  href={msg.productLink} 
                  target="_blank" 
                  className="mt-4 block w-full bg-yellow-400 hover:bg-yellow-500 text-red-700 font-black py-3 rounded-xl text-center text-[10px] transition-all shadow-md uppercase tracking-tighter hover:scale-105"
                >
                  🎯 VER CHOLLAZOS EN AMAZON
                </a>
              )}
            </div>
          </div>
        ))}

        {/* Indicador de que la IA está escribiendo */}
        {isTyping && (
            <div className="text-orange-500 text-[10px] font-black animate-pulse uppercase ml-2 italic flex items-center gap-1">
                <span>Rastreando Amazon</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
            </div>
        )}
        
        {/* Elemento invisible para forzar el scroll abajo */}
        <div ref={chatEndRef} />
      </div>

      {/* Pie del Chat (Input de escritura) */}
      <div className="p-4 bg-white border-t flex items-center gap-2">
        <input
          type="text"
          className="flex-1 p-3 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm text-gray-700 placeholder-gray-400 transition-all"
          placeholder="Escribe aquí (ej: zapatillas Nike)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          onClick={handleSendMessage}
          className="bg-orange-600 p-3 rounded-2xl text-white hover:bg-red-700 transition-all shadow-lg active:scale-95 transform hover:rotate-3"
        >
          {/* Icono de enviar */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
