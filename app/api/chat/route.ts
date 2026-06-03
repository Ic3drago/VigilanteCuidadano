/**
 * VigilanteCiudadano - Next.js App Router Route Handler (Chatbot Assistant API)
 * Location: app/api/chat/route.ts
 * Role: AI Engineer & Full-Stack Frontend Developer
 * 
 * DESIGN PRINCIPLES:
 * 1. OpenAI FETCH INTEGRATION: Interfaces directly with OpenAI completions endpoint using process.env.OPENAI_API_KEY.
 * 2. HISTORY AWARE CONVERSATION: Maps the array of messages to the standard OpenAI role-content schema.
 * 3. GRACEFUL CONTINGENCY FALLBACK: Employs a robust contextual NLP fallback if the API key is not present.
 */

import { NextResponse } from 'next/server';

interface IncomingMessage {
  id?: string;
  sender: 'user' | 'bot';
  text: string;
}

const SYSTEM_PROMPT = `Eres el Asistente Virtual Oficial de VigilanteCiudadano, una plataforma de seguridad en Bolivia. Tu objetivo es orientar a los ciudadanos. Si detectas una emergencia inminente o en curso, DEBES pedirles amablemente pero con firmeza que usen el botón principal de 'Reportar Emergencia' de la plataforma para despachar a la policía.

Además, conoces los números de teléfono alternativos de llamada a la policía en Bolivia (aparte del 110 general):
- PAC (Patrulla de Auxilio y Cooperación Ciudadana): 120 (o línea gratuita 800-14-0205)
- Bomberos (Emergencias e Incendios): 119
- FELCC (Fuerza Especial de Lucha Contra el Crimen): 122
- FELCV (Fuerza Especial de Lucha Contra la Violencia Familiar y Género): 120 o la línea de atención gratuita 800-14-0348
- Tránsito: 121
- Cruz Roja / Ambulancias: 123 o 2204990

Responde de forma concisa, formal y útil.`;

/**
 * Fallback Contextual NLP Responder.
 * Handles common orientative inquiries offline or in keyless environments.
 */
function contextualNlpFallback(lastMsg: string): string {
  const text = lastMsg.toLowerCase();

  // Detect inquiries for emergency numbers or alternative contacts
  if (
    text.includes('numero') ||
    text.includes('número') ||
    text.includes('telefono') ||
    text.includes('teléfono') ||
    text.includes('llamar') ||
    text.includes('contacto') ||
    text.includes('bomber') ||
    text.includes('felcc') ||
    text.includes('felcv') ||
    text.includes('pac') ||
    text.includes('transito') ||
    text.includes('tránsito')
  ) {
    return '📞 **Números de Emergencia y Auxilio en Bolivia (BOL-110):**\n\n' +
      '• **Radio Patrullas (Emergencias Generales):** 110\n' +
      '• **PAC (Patrulla de Auxilio y Cooperación):** 120 (o línea gratuita 800-14-0205)\n' +
      '• **Bomberos (Emergencias e Incendios):** 119\n' +
      '• **FELCC (Fuerza Especial de Lucha Contra el Crimen):** 122\n' +
      '• **FELCV (Lucha Contra la Violencia - Género/Familiar):** 120 o línea gratuita 800-14-0348\n' +
      '• **Tránsito (Accidentes viales):** 121\n' +
      '• **Cruz Roja / Ambulancias:** 123 o 2204990\n\n' +
      'Si se encuentra en peligro inmediato, presione el botón rojo de **"Reportar Emergencia"** en la pantalla principal para capturar su ubicación satelital y despachar auxilio.';
  }

  if (
    text.includes('robo') || 
    text.includes('ayuda') || 
    text.includes('emergencia') || 
    text.includes('asalto') || 
    text.includes('agresion') || 
    text.includes('pelea') ||
    text.includes('choque')
  ) {
    return '🚨 Detecto que estás reportando una emergencia o situación de peligro. Por favor, para emergencias graves usa el botón rojo de "Reportar Emergencia" en la página principal para capturar tu GPS y derivarte inmediatamente con una patrulla.';
  }

  if (text.includes('seguro') || text.includes('cifrado') || text.includes('privado') || text.includes('encriptar')) {
    return '🔒 VigilanteCiudadano cifra tus reportes directamente en tu navegador usando AES-GCM de 256 bits y PBKDF2. El servidor de la policía almacena los metadatos de triaje de IA, pero es técnicamente imposible que lean la descripción de tu reporte sin tu clave local.';
  }

  if (text.includes('mapa') || text.includes('patrulla') || text.includes('tiempo real') || text.includes('ubicacion')) {
    return '🗺️ Puedes auditar las patrullas activas en la sección "Ver Mapa en Vivo" de la página principal. El mapa se conecta a Supabase Realtime y te permite visualizar la geolocalización satelital de las unidades del BOL-110.';
  }

  if (text.includes('hola') || text.includes('buenos dias') || text.includes('buenas tardes')) {
    return '👋 ¡Hola! Soy el asistente virtual de VigilanteCiudadano. Estoy aquí para guiarte en el funcionamiento de la plataforma o informarte sobre nuestras tecnologías de seguridad. ¿En qué te puedo orientar hoy?';
  }

  return 'Entiendo tu consulta. Como asistente de VigilanteCiudadano, puedo guiarte sobre el encriptado de reportes, geolocalización de patrullas o derivación al BOL-110. ¿Podrías ser más específico con tu pregunta?';
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'El historial de "messages" es obligatorio y debe ser un array válido.' },
        { status: 400 }
      );
    }

    const lastUserMessage = messages[messages.length - 1]?.text || '';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Graceful contextual fallback
      console.log('OPENAI_API_KEY no detectada en Asistente Virtual. Activando motor contextual local.');
      const localReply = contextualNlpFallback(lastUserMessage);
      return NextResponse.json({ reply: localReply });
    }

    // Map conversation history to OpenAI Chat completions standard format
    // Map 'bot' sender to 'assistant' role and 'user' sender to 'user' role
    const formattedMessages = messages.map((m: IncomingMessage) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    // Inject system instructions
    const payloadMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...formattedMessages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: payloadMessages,
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error('Error de respuesta en OpenAI API (Chat):', response.statusText);
      const localReply = contextualNlpFallback(lastUserMessage);
      return NextResponse.json({ reply: localReply });
    }

    const chatData = await response.json();
    const replyText = chatData.choices[0].message.content.trim();

    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error('Error en API Chat Handler:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Fallo interno al procesar la conversación por IA.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
