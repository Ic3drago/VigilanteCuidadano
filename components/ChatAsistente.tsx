'use client';

/**
 * VigilanteCiudadano - ChatAsistente UI Component (Connected to AI Route)
 * Location: components/ChatAsistente.tsx
 * Role: AI Engineer & Full-Stack Frontend Developer
 * 
 * DESIGN PRINCIPLES:
 * 1. LIVE CONVERSATIONAL CLIENT: Interfaces directly with the POST /api/chat route handler.
 * 2. AUTO-SCROLL CONSOLE: Seamlessly shifts scroll heights on new bot replies.
 * 3. FALLBACK FAULT TOLERANCE: Renders safe orientative replies if connection drops.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ShieldAlert } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function ChatAsistente() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Welcome message when mounted
  useEffect(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'bot-welcome',
        sender: 'bot',
        text: '¡Hola! Soy el asistente virtual de VigilanteCiudadano. ¿En qué puedo guiarte u orientarte hoy?',
        timestamp: time
      }
    ]);
  }, []);

  // Automatic scroll to last message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    setInputValue('');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // 1. Add citizen speech message
    const userMsgId = Math.random().toString(36).substr(2, 9);
    const newUserMsg: Message = { id: userMsgId, sender: 'user', text: userText, timestamp: time };
    
    // Capture updated history to transmit to the API
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);

    setIsTyping(true);

    try {
      // 2. Fetch API route POST with complete conversational context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) {
        throw new Error('Fallo al conectar con la pasarela de conversación.');
      }

      const data = await response.json();
      const botMsgId = Math.random().toString(36).substr(2, 9);

      // 3. Add bot speech message
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, sender: 'bot', text: data.reply, timestamp: time }
      ]);

    } catch (error) {
      console.warn('Chat assistant fetch failed, active local fallback:', error);
      
      // Robust client-side local fallback so it remains active
      let fallbackText = 'Entiendo tu consulta. Como asistente de VigilanteCiudadano, puedo guiarte sobre el encriptado, geolocalización de patrullas o derivación al BOL-110. ¿Podrías ser más específico?';
      const lower = userText.toLowerCase();

      if (lower.includes('robo') || lower.includes('ayuda') || lower.includes('emergencia') || lower.includes('asalto') || lower.includes('choque')) {
        fallbackText = 'Por favor, para emergencias graves use el botón rojo de "Reportar Emergencia" en la página principal para derivarlo inmediatamente con una patrulla.';
      } else if (
        lower.includes('numero') ||
        lower.includes('número') ||
        lower.includes('telefono') ||
        lower.includes('teléfono') ||
        lower.includes('llamar') ||
        lower.includes('contacto') ||
        lower.includes('bomber') ||
        lower.includes('felcc') ||
        lower.includes('felcv') ||
        lower.includes('pac') ||
        lower.includes('transito') ||
        lower.includes('tránsito')
      ) {
        fallbackText = '📞 **Números de Emergencia y Auxilio en Bolivia (BOL-110):**\n\n' +
          '• **Radio Patrullas (Emergencias Generales):** 110\n' +
          '• **PAC (Patrulla de Auxilio y Cooperación):** 120 (o línea gratuita 800-14-0205)\n' +
          '• **Bomberos (Emergencias e Incendios):** 119\n' +
          '• **FELCC (Fuerza Especial de Lucha Contra el Crimen):** 122\n' +
          '• **FELCV (Lucha Contra la Violencia - Género/Familiar):** 120 o línea gratuita 800-14-0348\n' +
          '• **Tránsito (Accidentes viales):** 121\n' +
          '• **Cruz Roja / Ambulancias:** 123 o 2204990';
      } else if (lower.includes('cifrado') || lower.includes('seguro') || lower.includes('privado')) {
        fallbackText = 'Ciframos tus reportes con AES-GCM-256 en tu dispositivo antes de transmitirlos. La policía no puede leer tu descripción original.';
      }

      const botMsgId = Math.random().toString(36).substr(2, 9);
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, sender: 'bot', text: fallbackText, timestamp: time }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#1e3a8a] hover:bg-[#1a3275] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-none"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-slideUp">
          
          {/* Header */}
          <div className="bg-[#1e3a8a] text-white px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs">
                🛡️
              </div>
              <span className="text-xs font-black uppercase tracking-wider">Asistente Ciudadano</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors focus:outline-none"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Emergency 110 direct call banner */}
          <a
            href="tel:110"
            className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider py-2 px-4 flex items-center justify-center gap-1.5 transition-colors border-b border-red-700 shadow-inner text-center shrink-0"
          >
            <span>📞 Línea Directa de Emergencia - Llamar al 110</span>
          </a>

          {/* Messages scrollbox */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-normal shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#1e3a8a] text-white rounded-tr-none'
                      : msg.text.includes('Reportar Emergencia')
                      ? 'bg-rose-50 border border-rose-100 text-rose-700 rounded-tl-none font-medium'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}
                >
                  {/* Alert tag details if redirect occurs */}
                  {msg.sender === 'bot' && msg.text.includes('Reportar Emergencia') && (
                    <div className="flex items-center gap-1.5 mb-1 text-rose-600 font-bold uppercase text-[8px] tracking-wider">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Alerta de Derivación</span>
                    </div>
                  )}

                  <p>{msg.text}</p>
                </div>
                <span className="text-[8px] text-slate-400 mt-1 mx-1.5">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1 text-[9px] text-slate-400 italic bg-white border border-slate-100 p-2 rounded-xl max-w-[120px] shadow-sm animate-pulse">
                <span>Escribiendo...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Text Input area */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-2 bg-white flex gap-1.5 items-center">
            <input
              type="text"
              required
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              placeholder="Escribe tu consulta aquí..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:bg-white transition-all placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="w-8 h-8 bg-[#1e3a8a] text-white hover:bg-[#1a3275] rounded-xl flex items-center justify-center disabled:opacity-40 transition-all focus:outline-none"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
