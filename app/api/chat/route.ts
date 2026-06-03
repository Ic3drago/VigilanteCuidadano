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
import { GoogleGenerativeAI } from '@google/generative-ai';

interface IncomingMessage {
  id?: string;
  sender: 'user' | 'bot';
  text: string;
}

const SYSTEM_PROMPT = `Eres el Asistente Virtual Oficial de VigilanteCiudadano, una plataforma de seguridad en Bolivia. Tu objetivo es orientar a los ciudadanos sobre el funcionamiento de la plataforma (cifrado local de extremo a extremo Zero-Knowledge con AES-GCM-256, visualización de patrullas en tiempo real vía Supabase, reportes anónimos) y los servicios policiales.

Si detectas una emergencia inminente o en curso, DEBES pedirles amablemente pero con firmeza que usen el botón principal de 'Reportar Emergencia' de la plataforma para despachar a la policía de inmediato.

Además, conoces los números de teléfono directos de las Estaciones Policiales Integrales (EPI) por zonas para Cochabamba (llamando a estos números, la policía llega más rápido que canalizando por el 110 general):
- EPI Norte (PAC-120): 444-1234 (Sirve a zonas como Queru Queru, Cala Cala, Tupuraya, Pacata, Temporal, etc.)
- EPI Central (PAC-Centro): 444-0110 (Sirve a la Zona Central, Casco Viejo, El Prado, Plaza Colón, etc.)
- EPI Sur (PAC-304): 444-5678 (Sirve a la Zona Sur, Alalay, Jaihuayco, Valle Hermoso, etc.)
- EPI Este (PAC-207): 444-8765 (Sirve a Pacata Alta, Quintanilla, Chafra, etc.)
- EPI Oeste (PAC-515): 444-4321 (Sirve a Coña Coña, Sarco, Villa Galindo, Chimba, etc.)

También conoces los números de teléfono alternativos de llamada a la policía en Bolivia:
- PAC (Patrulla de Auxilio y Cooperación Ciudadana): 120 (o línea gratuita 800-14-0205)
- Bomberos (Emergencias e Incendios): 119
- FELCC (Fuerza Especial de Lucha Contra el Crimen): 122
- FELCV (Fuerza Especial de Lucha Contra la Violencia Familiar y Género): 120 o la línea de atención gratuita 800-14-0348
- Tránsito: 121
- Cruz Roja / Ambulancias: 123 o 2204990

Además del encriptado, mapa y EPIs, puedes responder de manera general e inteligente a cualquier pregunta del usuario relacionada con la seguridad ciudadana en Bolivia, leyes nacionales (como la Ley 264 y Ley 348), consejos de prevención de delitos y qué hacer en caso de robos o accidentes.

Si el usuario pregunta por el número policial o la EPI de una zona específica (por ejemplo, Queru Queru, Cala Cala, Zona Sur o Central), debes indicarle a qué EPI corresponde de tu lista y darle su número telefónico directo. Responde de forma concisa, formal y útil.`;

/**
 * Fallback Contextual NLP Responder.
 * Handles common orientative inquiries offline or in keyless environments.
 */
function contextualNlpFallback(lastMsg: string): string {
  const text = lastMsg.toLowerCase();

  // 1. Zonal EPI Queries (Cochabamba)
  if (text.includes('queru queru') || text.includes('queruqueru') || (text.includes('norte') && (text.includes('epi') || text.includes('policia') || text.includes('número') || text.includes('numero') || text.includes('telefono') || text.includes('teléfono')))) {
    return '📞 **EPI Norte (PAC-120) - Zona Norte (Queru Queru, Cala Cala):**\n\n' +
      '• **Estación:** Estación Policial Integral Norte (EPI Norte)\n' +
      '• **Línea Directa:** **444-1234**\n' +
      '• **Zonas de cobertura:** Queru Queru, Cala Cala, Tupuraya, Pacata, Temporal, y aledaños.\n\n' +
      'Para que la patrulla de la zona norte llegue lo más rápido posible, comuníquese directamente a esta línea directa, evitando la saturación del 110 general.';
  }

  if (text.includes('central') || text.includes('centro') || (text.includes('centro') && (text.includes('epi') || text.includes('policia') || text.includes('número') || text.includes('numero')))) {
    return '📞 **EPI Central (PAC-Centro) - Cuadrante Central:**\n\n' +
      '• **Estación:** Estación Policial Integral Central (EPI Central)\n' +
      '• **Línea Directa:** **444-0110**\n' +
      '• **Zonas de cobertura:** Casco Viejo, El Prado, Plaza Colón, Plaza 14 de Septiembre, Muyurina, y cuadrantes centrales.\n\n' +
      'Para una respuesta rápida dentro del cuadrante central, le sugerimos llamar directamente a esta línea.';
  }

  if (text.includes('sur') && (text.includes('epi') || text.includes('policia') || text.includes('número') || text.includes('numero') || text.includes('telefono') || text.includes('teléfono') || text.includes('alalay'))) {
    return '📞 **EPI Sur (PAC-304) - Zona Sur:**\n\n' +
      '• **Estación:** Estación Policial Integral Sur (EPI Sur)\n' +
      '• **Línea Directa:** **444-5678**\n' +
      '• **Zonas de cobertura:** Laguna Alalay, Jaihuayco, Valle Hermoso, Sebastián Pagador y la zona sur.\n\n' +
      'Comuníquese a este número para un despacho inmediato en la zona sur.';
  }

  if (text.includes('este') && (text.includes('epi') || text.includes('policia') || text.includes('número') || text.includes('numero') || text.includes('telefono') || text.includes('teléfono'))) {
    return '📞 **EPI Este (PAC-207) - Zona Este:**\n\n' +
      '• **Estación:** Estación Policial Integral Este (EPI Este)\n' +
      '• **Línea Directa:** **444-8765**\n' +
      '• **Zonas de cobertura:** Pacata Alta, Quintanilla, Chafra, y la zona este.\n\n' +
      'Use esta línea directa para que el auxilio llegue más rápido en el sector este.';
  }

  if (text.includes('oeste') && (text.includes('epi') || text.includes('policia') || text.includes('número') || text.includes('numero') || text.includes('telefono') || text.includes('teléfono') || text.includes('coña') || text.includes('sarco'))) {
    return '📞 **EPI Oeste (PAC-515) - Zona Oeste (Coña Coña, Sarco):**\n\n' +
      '• **Estación:** Estación Policial Integral Oeste (EPI Oeste)\n' +
      '• **Línea Directa:** **444-4321**\n' +
      '• **Zonas de cobertura:** Coña Coña, Sarco, Villa Galindo, la Chimba y la zona oeste.\n\n' +
      'Comuníquese directamente a este número para un despacho veloz de patrullas en la zona oeste.';
  }

  // 2. Generic nearest stations query
  if (
    text.includes('cercan') ||
    text.includes('donde') ||
    text.includes('dónde') ||
    text.includes('ubicacion') ||
    text.includes('ubicación') ||
    text.includes('direccion') ||
    text.includes('dirección') ||
    text.includes('estacion') ||
    text.includes('estación') ||
    text.includes('epi')
  ) {
    return '🏢 **Estaciones Policiales Integrales (EPI) por Zona (Cochabamba):**\n\n' +
      '• **EPI Norte:** Queru Queru, Cala Cala, Pacata Baja. 📞 **444-1234**\n' +
      '• **EPI Central:** Casco Viejo, Centro, El Prado. 📞 **444-0110**\n' +
      '• **EPI Sur:** Alalay, Jaihuayco, Valle Hermoso. 📞 **444-5678**\n' +
      '• **EPI Este:** Pacata Alta, Quintanilla, Chafra. 📞 **444-8765**\n' +
      '• **EPI Oeste:** Coña Coña, Sarco, Villa Galindo. 📞 **444-4321**\n\n' +
      '💡 Si tiene una emergencia activa en su ubicación, le aconsejamos presionar el botón rojo de **"Reportar Emergencia"** en la página principal para geolocalizar y enviar ayuda inmediatamente desde la EPI más cercana.';
  }

  // 3. Question helper menu
  if (
    text.includes('pregunta') ||
    text.includes('que puedo') ||
    text.includes('qué puedo') ||
    text.includes('ayuda') ||
    text.includes('menu') ||
    text.includes('menú') ||
    text.includes('opciones')
  ) {
    return '🤖 **¿En qué puedo guiarte hoy? Como tu asistente de seguridad, puedes preguntarme sobre:**\n\n' +
      '• **EPIs zonales y números:** escribe "Queru Queru", "Zona Sur", "Centro", "Este" u "Oeste".\n' +
      '• **El encriptado de reportes:** escribe "cifrado", "seguro" o "privacidad".\n' +
      '• **La geolocalización de patrullas:** escribe "mapa" o "patrullas".\n' +
      '• **Leyes de seguridad ciudadana:** escribe "leyes", "Ley 264", "Ley 348" o "Código Penal".\n' +
      '• **Reportar emergencias:** escribe "denunciar" o "emergencia".';
  }

  // 4. Laws and regulations query
  if (
    text.includes('ley') ||
    text.includes('leyes') ||
    text.includes('codigo penal') ||
    text.includes('código penal') ||
    text.includes('normativa')
  ) {
    return '⚖️ **Normas de Seguridad en Bolivia:**\n\n' +
      '• **Ley 264 (Seguridad Ciudadana):** Promueve la prevención, auxilio y cooperación policial.\n' +
      '• **Ley 348 (Contra la Violencia hacia las Mujeres):** Garantiza protección integral. Delitos de agresión física o familiar se derivan prioritariamente a la FELCV.\n' +
      '• **Omisión de Socorro (Art. 262 del C.P.):** Obligación penal de auxiliar en accidentes de tráfico. El Robo Agravado es penado por el Art. 331.\n\n' +
      '¿Desea saber cómo encriptar un informe relacionado con estas infracciones?';
  }

  // 5. Vigilante Ciudadano Info Queries
  if (
    text.includes('que es') ||
    text.includes('qué es') ||
    text.includes('funcion') ||
    text.includes('función') ||
    text.includes('vigilante') ||
    text.includes('proyecto') ||
    text.includes('plataforma')
  ) {
    return '🛡️ **VigilanteCiudadano** es una plataforma digital avanzada de seguridad ciudadana boliviana.\n\n' +
      '• **Reportes Cifrados:** Tus denuncias se encriptan de extremo a extremo en tu dispositivo mediante AES-GCM-256 y PBKDF2 (Zero-Knowledge). La policía solo lee el triaje de IA, no tu descripción original.\n' +
      '• **Geolocalización Automática:** Al reportar, capturamos tu ubicación satelital para derivarte con la EPI (Estación Policial Integral) de tu zona.\n' +
      '• **Mapa de Patrullas:** Puedes ver en tiempo real la ubicación de las patrullas BOL-110 conectadas mediante Supabase Realtime.\n\n' +
      '¿Deseas saber cómo reportar una emergencia o conocer los números de contacto de alguna EPI?';
  }

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
    return '📞 **Directorio de Emergencias de Bolivia (BOL-110):**\n\n' +
      '• **Radio Patrullas (General):** 110\n' +
      '• **Bomberos (Emergencias e Incendios):** 119\n' +
      '• **FELCC (Crimen):** 122 | **FELCV (Violencia familiar):** 120 (Línea Gratuita: 800-14-0348)\n' +
      '• **Tránsito (Accidentes viales):** 121\n' +
      '• **Cruz Roja / Ambulancias:** 123 o 2204990\n\n' +
      '🏢 **Líneas Directas de Estaciones Policiales Integrales (EPI):**\n' +
      '• **EPI Norte (Queru Queru, Cala Cala):** 📞 **444-1234**\n' +
      '• **EPI Central (Casco Viejo, Centro):** 📞 **444-0110**\n' +
      '• **EPI Sur (Alalay, Jaihuayco):** 📞 **444-5678**\n' +
      '• **EPI Este (Pacata, Este):** 📞 **444-8765**\n' +
      '• **EPI Oeste (Coña Coña, Sarco):** 📞 **444-4321**\n\n' +
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

  return 'Entiendo tu consulta. Como asistente de VigilanteCiudadano, puedo guiarte sobre el encriptado de reportes, geolocalización de patrullas o las líneas directas de las EPI por zonas. ¿Podrías ser más específico con tu pregunta?';
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
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    // 1. Try Gemini API first if configured
    if (geminiApiKey) {
      try {
        console.log('Iniciando respuesta del Asistente Virtual con Gemini 3.5 Flash.');
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const chatModel = genAI.getGenerativeModel({ 
          model: 'gemini-3.5-flash',
          systemInstruction: SYSTEM_PROMPT
        });

        // Format history for Gemini contents array
        // Gemini API uses 'user' and 'model' roles. In ChatAsistente, sender is 'user' or 'bot'
        const contents = messages.map((m: IncomingMessage) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        const result = await chatModel.generateContent({
          contents: contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 350
          }
        });

        const replyText = result.response.text().trim();
        return NextResponse.json({ reply: replyText });
      } catch (geminiError) {
        console.error('Error al generar respuesta con Gemini:', geminiError);
        // Cascade downwards
      }
    }

    // 2. Try OpenAI API if configured
    if (openaiApiKey) {
      try {
        console.log('Iniciando respuesta del Asistente Virtual con OpenAI gpt-4o-mini.');
        const formattedMessages = messages.map((m: IncomingMessage) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

        const payloadMessages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...formattedMessages
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: payloadMessages,
            temperature: 0.3,
            max_tokens: 300
          })
        });

        if (response.ok) {
          const chatData = await response.json();
          const replyText = chatData.choices[0].message.content.trim();
          return NextResponse.json({ reply: replyText });
        }
        console.error('Error de respuesta en OpenAI API (Chat):', response.statusText);
      } catch (openaiError) {
        console.error('Error al conectar con OpenAI:', openaiError);
      }
    }

    // 3. Fallback locally if no keys are found or requests fail
    console.log('Activando motor contextual local (Offline Fallback) para el Asistente Virtual.');
    const localReply = contextualNlpFallback(lastUserMessage);
    return NextResponse.json({ reply: localReply });

  } catch (error) {
    console.error('Error en API Chat Handler:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Fallo interno al procesar la conversación por IA.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
