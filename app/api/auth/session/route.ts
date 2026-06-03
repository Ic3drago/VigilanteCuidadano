/**
 * VigilanteCiudadano - Next.js App Router Route Handler (Session Verification)
 * Location: app/api/auth/session/route.ts
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '../../../../utils/authCrypto';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('vc_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.id,
        tipo: session.tipo,
        identificador: session.identificador,
        nombre_completo: session.nombre_completo,
        rango: session.rango
      }
    });

  } catch (error) {
    console.error('Session Verification Endpoint Error:', error);
    return NextResponse.json(
      { error: 'Fallo al verificar sesión en el servidor.' },
      { status: 500 }
    );
  }
}
