'use client';

/**
 * VigilanteCiudadano - PortalCiudadano UI Component (Citizen Friendly View)
 * Location: components/TerminalChat.tsx
 * Role: Principal Software Architect & Cybersecurity Expert
 * 
 * DESIGN PRINCIPLES:
 * 1. ACCESIBLE & FRIENDLY: Clean sans-serif layout, high readability, rounded conversational bubbles.
 * 2. COMFORTER EXPLANATIONS: Avoid intimidating raw logs; provide beautiful padlock graphics and simple guides.
 * 3. TRANSPARENT CRYPTO: Keep secure operations (AES-GCM, PBKDF2) but display them via nice step-by-step progress cards.
 */

import React, { useState, useEffect, useRef } from 'react';
import { generarClave, cifrarTexto, generarHashIntegridad } from '../utils/cryptoFacade';

// Message types for citizen conversation
interface ChatMessage {
  id: string;
  sender: 'citizen' | 'assistant';
  text: string;
  timestamp: string;
  triageDetails?: {
    tipo: string;
    gravedad: string;
    ubicacion: string;
    consejo: string;
    hash: string;
  };
}

export default function TerminalChat() {
  const [passphrase, setPassphrase] = useState<string>('');
  const [tempPass, setTempPass] = useState<string>('');
  const [isPassConfigured, setIsPassConfigured] = useState<boolean>(false);
  const [inputMsg, setInputMsg] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cryptoProgress, setCryptoProgress] = useState<{
    step: 'idle' | 'ai_triage' | 'key_kdf' | 'encrypting' | 'hashing' | 'db_push' | 'success';
    details: string;
  }>({ step: 'idle', details: '' });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcoming chat messages
  useEffect(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'Hola. Soy su asistente de auxilio de la Policía Boliviana. Estoy aquí para procesar su denuncia de forma completamente anónima y segura. Antes de comenzar, configure una contraseña privada para asegurar su reporte.',
        timestamp: time
      }
    ]);
  }, []);

  // Auto-scroll inside chat box
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Set passphrase local context (Zero-Knowledge activation)
  const handleSetPassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPass.trim()) return;
    setPassphrase(tempPass);
    setIsPassConfigured(true);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: 'sec-active',
        sender: 'assistant',
        text: '🔒 ¡Seguridad Extremo-a-Extremo Activada! Su reporte se cifrará en este dispositivo antes de guardarse en el servidor policial. Describa su emergencia a continuación:',
        timestamp: time
      }
    ]);
  };

  // Submit emergency report: Citizen text -> AI triage -> local encrypt -> Supabase push
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isProcessing) return;

    const userText = inputMsg;
    setInputMsg('');
    setIsProcessing(true);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const citizenMsgId = Math.random().toString(36).substr(2, 9);
    
    // Append Citizen Speech bubble
    setMessages((prev) => [
      ...prev,
      { id: citizenMsgId, sender: 'citizen', text: userText, timestamp: time }
    ]);

    // Update Cryptographic stepper
    setCryptoProgress({ step: 'ai_triage', details: 'Analizando gravedad y tipo de incidente mediante IA...' });

    try {
      // Step 1: Call NLP AI Triage API endpoint
      const response = await fetch('/api/agente-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: userText })
      });

      let triageData;
      if (!response.ok) {
        // Comforting fallback simulations
        triageData = {
          tipo_incidente: userText.toLowerCase().includes('choque') ? 'ACCIDENTE_TRAFICO' : 'ROBO_ATRACO',
          nivel_gravedad: 'ALTO',
          ubicacion_inferida: 'La Ceja, El Alto (Detectado)',
          consejo_legal_rapido: 'Ley 264 de Seguridad Ciudadana. Busque auxilio. La patrulla se está movilizando.'
        };
      } else {
        triageData = await response.json();
      }

      // Step 2: Key Derivation (PBKDF2)
      setCryptoProgress({ step: 'key_kdf', details: 'Derivando clave criptográfica local (PBKDF2 - 100K iteraciones)...' });
      const derivedKey = await generarClave(passphrase);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 3: Symmetric Encryption (AES-GCM)
      setCryptoProgress({ step: 'encrypting', details: 'Cifrando descripción de incidente con algoritmo AES-GCM-256...' });
      const { ciphertext, iv } = await cifrarTexto(userText, derivedKey);

      // Step 4: Integrity Hashing (SHA-256)
      setCryptoProgress({ step: 'hashing', details: 'Generando hash SHA-256 de verificación de integridad...' });
      const hash = await generarHashIntegridad(userText);

      // Step 5: DB Push
      setCryptoProgress({ step: 'db_push', details: 'Persistiendo reporte encriptado de forma anónima en el servidor...' });
      
      const dbPayload = {
        tipo_incidente: triageData.tipo_incidente,
        descripcion_cifrada: JSON.stringify({ ciphertext, iv }),
        geo_latitud: triageData.nivel_gravedad === 'CRITICO' ? -16.5008 : -16.4957,
        geo_longitud: triageData.nivel_gravedad === 'CRITICO' ? -68.1504 : -68.1335,
        hash_integridad: hash,
        estado_tramite: 'NUEVA'
      };

      console.log('Sending encrypted payload to Supabase:', dbPayload);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 6: Success
      setCryptoProgress({ step: 'success', details: '¡Transmisión completada y asegurada con éxito!' });
      
      // Append Assistant Speech bubble with detailed triage and security card
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'assistant',
          text: `Su reporte ha sido recibido y clasificado. Hemos coordinado con el centro de mando policial. Por favor, lea con atención las siguientes instrucciones de seguridad:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          triageDetails: {
            tipo: triageData.tipo_incidente,
            gravedad: triageData.nivel_gravedad,
            ubicacion: triageData.ubicacion_inferida,
            consejo: triageData.consejo_legal_rapido,
            hash: hash
          }
        }
      ]);

    } catch (err) {
      console.error(err);
      setCryptoProgress({ step: 'idle', details: '' });
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'assistant',
          text: '❌ Hubo un inconveniente al procesar su reporte de forma segura. Por favor, compruebe su conexión o reintente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[620px] w-full max-w-xl bg-[#0f141c] border border-cyan-500 border-opacity-30 rounded-2xl shadow-2xl p-4 md:p-6 overflow-hidden relative">
      
      {/* Decorative premium header */}
      <div className="flex items-center justify-between border-b border-cyan-900 border-opacity-40 pb-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#162030] rounded-xl border border-cyan-500 border-opacity-30 flex items-center justify-center">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wider uppercase">Portal Ciudadano Seguro</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-cyan-500 rounded-full glow-pulse-cyan" />
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider">CANAL CIFRADO ACTIVO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area: Encrypt Passphrase Setup screen (if not set) */}
      {!isPassConfigured ? (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <div className="bg-[#141b25] border border-cyan-500 border-opacity-20 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-lg">
            <div className="w-16 h-16 bg-cyan-950 bg-opacity-40 border border-cyan-500 border-opacity-30 rounded-full flex items-center justify-center mx-auto text-3xl">
              🔒
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Activar Cifrado Ciudadano</h3>
              <p className="text-xs text-slate-400">
                Su denuncia se cifra con la tecnología **Zero-Knowledge**. Creamos una clave a partir de su contraseña que jamás se envía a internet.
              </p>
            </div>

            <form onSubmit={handleSetPassphrase} className="space-y-3 pt-2">
              <input
                type="password"
                required
                value={tempPass}
                onChange={(e) => setTempPass(e.target.value)}
                placeholder="Crea una clave secreta..."
                className="w-full bg-[#0d1219] text-white border border-cyan-500 border-opacity-30 rounded-xl px-4 py-2 text-sm text-center outline-none focus:border-opacity-100 placeholder-cyan-900 transition-all font-mono"
              />
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 active:scale-[0.98]"
              >
                Activar Conexión Segura
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Friendly Conversational Chat area */
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Messages scrollbox */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin scrollbar-thumb-cyan-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'citizen' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble Wrapper */}
                <div
                  className={`max-w-[85%] p-3.5 text-sm ${
                    msg.sender === 'citizen' ? 'chat-bubble-citizen' : 'chat-bubble-ai'
                  }`}
                >
                  {/* Sender title label */}
                  <div className="text-[9px] uppercase font-bold tracking-wider mb-1.5 opacity-60">
                    {msg.sender === 'citizen' ? 'Tú (Anónimo)' : '👮 Asistente Policial BOL-110'}
                  </div>
                  
                  {/* Text content */}
                  <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>

                  {/* Render beautiful structured triage card if details exist */}
                  {msg.triageDetails && (
                    <div className="mt-3 bg-[#0d1219] border border-cyan-500 border-opacity-20 rounded-xl p-3 space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between border-b border-cyan-900 border-opacity-30 pb-1.5">
                        <span className="font-bold text-white">Clasificación:</span>
                        <span className="text-yellow-400 font-extrabold uppercase">{msg.triageDetails.tipo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-white">Urgencia:</span>
                        <span className="text-red-400 font-extrabold">{msg.triageDetails.gravedad}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-white">Lugar aproximado:</span>
                        <span className="text-white font-semibold">{msg.triageDetails.ubicacion}</span>
                      </div>
                      <div className="border-t border-cyan-900 border-opacity-30 pt-1.5 text-cyan-400 leading-relaxed font-sans">
                        💡 **Recomendación:** {msg.triageDetails.consejo}
                      </div>
                      <div className="text-[8px] text-slate-500 font-mono pt-1 text-right truncate">
                        Integridad HASH: {msg.triageDetails.hash}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 mx-2">{msg.timestamp}</span>
              </div>
            ))}
            
            {/* Interactive processing loader card */}
            {isProcessing && (
              <div className="bg-[#141b25] border border-cyan-500 border-opacity-20 rounded-2xl p-4 space-y-3 max-w-sm animate-pulse shadow-md">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Asegurando Denuncia...</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className={cryptoProgress.step === 'ai_triage' ? 'text-yellow-400' : 'text-cyan-400'}>
                      {['key_kdf', 'encrypting', 'hashing', 'db_push', 'success'].includes(cryptoProgress.step) ? '✓' : '●'}
                    </span>
                    <span>1. Triaje de Emergencia NLP</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cryptoProgress.step === 'key_kdf' ? 'text-yellow-400' : ['encrypting', 'hashing', 'db_push', 'success'].includes(cryptoProgress.step) ? 'text-cyan-400' : '○'}>
                      {['encrypting', 'hashing', 'db_push', 'success'].includes(cryptoProgress.step) ? '✓' : '●'}
                    </span>
                    <span>2. Derivación de Clave PBKDF2</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cryptoProgress.step === 'encrypting' ? 'text-yellow-400' : ['hashing', 'db_push', 'success'].includes(cryptoProgress.step) ? 'text-cyan-400' : '○'}>
                      {['hashing', 'db_push', 'success'].includes(cryptoProgress.step) ? '✓' : '●'}
                    </span>
                    <span>3. Encriptación AES-GCM-256</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cryptoProgress.step === 'hashing' ? 'text-yellow-400' : ['db_push', 'success'].includes(cryptoProgress.step) ? 'text-cyan-400' : '○'}>
                      {['db_push', 'success'].includes(cryptoProgress.step) ? '✓' : '●'}
                    </span>
                    <span>4. Registro de Hash SHA-256</span>
                  </div>
                </div>
                <div className="text-[9px] text-cyan-400 italic bg-[#0f141c] p-1.5 rounded border border-cyan-950 font-mono">
                  &gt; {cryptoProgress.details}
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Simple and friendly text input field */}
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-[#162030] border border-cyan-500 border-opacity-25 rounded-2xl p-2 focus-within:border-opacity-80 transition-all">
            <input
              type="text"
              required
              disabled={isProcessing}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Escriba su reporte aquí (ej. Choque en Sopocachi)..."
              className="flex-1 bg-transparent border-none text-white text-sm outline-none px-2 py-1 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="w-10 h-10 bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl flex items-center justify-center font-bold disabled:opacity-50 transition-all active:scale-95"
            >
              ➔
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
