/**
 * VigilanteCiudadano - Next.js App Router Route Handler (Login Endpoint)
 * Location: app/api/auth/login/route.ts
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '../../../../utils/supabaseClient';
import { createSessionToken } from '../../../../utils/authCrypto';
import { hashPin } from '../../../../utils/authCryptoServer';

export async function POST(req: Request) {
  try {
    const { tipo, identificador, pin } = await req.json();

    if (!tipo || !identificador || !pin) {
      return NextResponse.json(
        { error: 'Todos los campos (tipo, identificador, pin) son obligatorios.' },
        { status: 400 }
      );
    }

    if (tipo !== 'oficial' && tipo !== 'operador') {
      return NextResponse.json(
        { error: 'Tipo de autenticación no válido. Debe ser "oficial" u "operador".' },
        { status: 400 }
      );
    }

    let userRecord: any = null;

    // 1. Fetch user data from database based on role type
    if (tipo === 'oficial') {
      // Plate number (e.g. "PAC-402")
      const { data, error } = await supabase
        .from('vc_oficiales')
        .select('id, numero_placa, nombre_completo, rango, pin_hash, pin_salt')
        .eq('numero_placa', identificador.trim().toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('Error querying vc_oficiales:', error.message);
        return NextResponse.json({ error: 'Error interno de base de datos.' }, { status: 500 });
      }
      userRecord = data;
    } else {
      // Operator credential ID (e.g. "SGT. QUISPE")
      const { data, error } = await supabase
        .from('vc_operadores')
        .select('id, credencial_id, nombre_completo, pin_hash, pin_salt')
        .eq('credencial_id', identificador.trim().toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('Error querying vc_operadores:', error.message);
        return NextResponse.json({ error: 'Error interno de base de datos.' }, { status: 500 });
      }
      userRecord = data;
    }

    // 2. If user not found
    if (!userRecord || !userRecord.pin_hash || !userRecord.pin_salt) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Compruebe sus datos.' },
        { status: 401 }
      );
    }

    // 3. Verify PIN hash
    const computedHash = hashPin(pin, userRecord.pin_salt);
    if (computedHash !== userRecord.pin_hash) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Compruebe sus datos.' },
        { status: 401 }
      );
    }

    // 4. Generate secure session token
    const sessionPayload = {
      id: userRecord.id,
      tipo,
      identificador: tipo === 'oficial' ? userRecord.numero_placa : userRecord.credencial_id,
      nombre_completo: userRecord.nombre_completo,
      rango: tipo === 'oficial' ? userRecord.rango : 'OPERADOR_CENTRAL',
      timestamp: Date.now()
    };

    const token = await createSessionToken(sessionPayload);

    // 5. Configure HttpOnly secure cookie
    const cookieStore = cookies();
    cookieStore.set('vc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours session duration
      path: '/'
    });

    // 6. Return public user info
    return NextResponse.json({
      success: true,
      user: {
        id: sessionPayload.id,
        tipo: sessionPayload.tipo,
        identificador: sessionPayload.identificador,
        nombre_completo: sessionPayload.nombre_completo,
        rango: sessionPayload.rango
      }
    });

  } catch (error: any) {
    console.error('Login Endpoint Error:', error);
    return NextResponse.json(
      { error: 'Fallo crítico al iniciar sesión en el servidor.' },
      { status: 500 }
    );
  }
}
