/**
 * VigilanteCiudadano - Next.js App Router Route Handler (AI Triage Endpoint)
 * Location: app/api/agente-ia/route.ts
 * Role: Principal Software Architect & Cybersecurity Expert
 * 
 * DESIGN PRINCIPLES:
 * 1. OpenAI INTEGRATION: Uses native fetch calls to the OpenAI API endpoint.
 * 2. BOLIVIAN GEOGRAPHICAL CONTEXT: Models an active dispatcher for BOL-110 emergencies in Bolivia.
 * 3. TRY-CATCH GRACEFUL FALLBACK: Falls back to a local NLP parser if OPENAI_API_KEY is not defined.
 */

import { NextResponse } from 'next/server';

export interface TriageResponse {
  tipo_incidente: 'ROBO_ATRACO' | 'ACCIDENTE_TRAFICO' | 'DISTURBIOS' | 'VIOLENCIA_DOMESTICA' | 'AGRESION' | 'SOSPECHOSO' | 'OTRO';
  nivel_gravedad: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRITICO';
  consejo_legal_rapido: string;
}

const SYSTEM_PROMPT = `
Eres el despachador de emergencias de Inteligencia Artificial para la Policía Boliviana (BOL-110).
Tu trabajo es recibir reportes de ciudadanos bolivianos en lenguaje natural (los cuales pueden incluir modismos y calles conocidas de Bolivia, ej. "motochorro", "pacos", "tombo", "clefero", "achuraron", "bloqueo", "loteadores", "trancadera", "La Ceja", "Sopocachi", "Equipetrol").

Sigue estas reglas estrictas de nivel de gravedad (nivel_gravedad):
- "CRITICO": Situaciones de riesgo de vida inminente, homicidios, asesinatos, muerte, personas heridas con armas (pistola, cuchillo, arma blanca/fuego), tiroteos o secuestros activos.
- "ALTO": Agresiones físicas violentas, heridas graves o sangre (sin riesgo vital inmediato), violencia familiar/doméstica física activa o accidentes de tráfico con personas lesionadas.
- "MODERADO": Robos/hurtos comunes sin violencia armada o lesiones corporales severas (ej. robo de billetera/celular), disturbios públicos leves o vandalismo.
- "BAJO": Sospechosos merodeando, problemas de tránsito sin heridos, trancaderas, etc.

Debes analizar el informe y devolver EXCLUSIVAMENTE un objeto JSON válido con los siguientes campos exactos, sin bloques de código markdown (sin \`\`\`json) y sin explicaciones adicionales:
{
  "tipo_incidente": "ROBO_ATRACO" | "ACCIDENTE_TRAFICO" | "DISTURBIOS" | "VIOLENCIA_DOMESTICA" | "AGRESION" | "SOSPECHOSO" | "OTRO",
  "nivel_gravedad": "BAJO" | "MODERADO" | "ALTO" | "CRITICO",
  "consejo_legal_rapido": "Un consejo legal de seguridad rápido basado en el Código Penal Boliviano o normas de auxilio (máximo 250 caracteres)"
}
`;

/**
 * Fallback Local NLP Triage Engine.
 * Essential for offline/demo reliability.
 */
function localNlpFallback(mensaje: string): TriageResponse {
  const text = mensaje.toLowerCase();

  let tipo_incidente: TriageResponse['tipo_incidente'] = 'OTRO';
  if (text.includes('rob') || text.includes('motochorro') || text.includes('asalto') || text.includes('choreo') || text.includes('achurar')) {
    tipo_incidente = 'ROBO_ATRACO';
  } else if (text.includes('choque') || text.includes('accidente') || text.includes('atropell') || text.includes('tránsito')) {
    tipo_incidente = 'ACCIDENTE_TRAFICO';
  } else if (text.includes('pelea') || text.includes('golpe') || text.includes('agred') || text.includes('puñete')) {
    tipo_incidente = 'AGRESION';
  } else if (text.includes('bloqueo') || text.includes('marcha') || text.includes('protesta') || text.includes('dinamita')) {
    tipo_incidente = 'DISTURBIOS';
  } else if (text.includes('pareja') || text.includes('espos') || text.includes('violencia familiar') || text.includes('marido')) {
    tipo_incidente = 'VIOLENCIA_DOMESTICA';
  } else if (text.includes('sospech') || text.includes('clefero') || text.includes('merodeando')) {
    tipo_incidente = 'SOSPECHOSO';
  }

  let nivel_gravedad: TriageResponse['nivel_gravedad'] = 'MODERADO';
  if (
    text.includes('cuchillo') || 
    text.includes('arma') || 
    text.includes('sangre') || 
    text.includes('pistola') || 
    text.includes('muriendo') || 
    text.includes('secuestro') ||
    text.includes('matar') ||
    text.includes('mataron') ||
    text.includes('muerte') ||
    text.includes('muerto') ||
    text.includes('asesin') ||
    text.includes('homicid') ||
    text.includes('cadav') ||
    text.includes('fallec')
  ) {
    nivel_gravedad = 'CRITICO';
  } else if (
    text.includes('herido') || 
    text.includes('golpes') || 
    text.includes('urgente')
  ) {
    nivel_gravedad = 'ALTO';
  } else if (text.includes('sospechoso') || text.includes('vigilando') || text.includes('trancadera')) {
    nivel_gravedad = 'BAJO';
  }

  let consejo_legal_rapido = 'Busque refugio inmediato en un área segura e iluminada y espere instrucciones oficiales.';
  if (tipo_incidente === 'ROBO_ATRACO') {
    consejo_legal_rapido = 'No oponga resistencia. Su vida es prioridad. El Robo Agravado es sancionado por el Art. 331 del Código Penal Boliviano.';
  } else if (tipo_incidente === 'ACCIDENTE_TRAFICO') {
    consejo_legal_rapido = 'No mueva a los heridos salvo riesgo inminente. Prestar auxilio es obligatorio bajo sanción penal por Omisión de Socorro (Art. 262).';
  } else if (tipo_incidente === 'VIOLENCIA_DOMESTICA') {
    consejo_legal_rapido = 'Póngase a salvo de inmediato. La Ley 348 protege de forma integral a las mujeres contra todo tipo de violencia.';
  }

  return {
    tipo_incidente,
    nivel_gravedad,
    consejo_legal_rapido
  };
}

export async function POST(req: Request) {
  try {
    const { mensaje } = await req.json();

    if (!mensaje || typeof mensaje !== 'string') {
      return NextResponse.json(
        { error: 'El campo "mensaje" es obligatorio y debe ser texto plano.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Graceful fallback to local Bolivian dialect engine
      console.log('OPENAI_API_KEY no configurada. Activando motor local NLP de despacho BOL-110.');
      const localResult = localNlpFallback(mensaje);
      return NextResponse.json(localResult);
    }

    // Direct HTTP integration with OpenAI endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: mensaje }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      console.error('Error de respuesta en OpenAI API:', response.statusText);
      const localResult = localNlpFallback(mensaje);
      return NextResponse.json(localResult);
    }

    const chatData = await response.json();
    const responseContent = chatData.choices[0].message.content.trim();

    // Parse strictly derived JSON
    const parsedTriage: TriageResponse = JSON.parse(responseContent);

    return NextResponse.json(parsedTriage);

  } catch (error) {
    console.error('API Error try/catch en Triaje-IA:', error);
    
    // Ultimate recovery path to prevent crash (status 500 but returned as structured data if needed,
    // or standard HTTP 500 error as requested).
    return new NextResponse(
      JSON.stringify({ error: 'Fallo al procesar el triaje del incidente por IA.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
