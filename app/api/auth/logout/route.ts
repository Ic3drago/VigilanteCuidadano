/**
 * VigilanteCiudadano - Next.js App Router Route Handler (Logout Endpoint)
 * Location: app/api/auth/logout/route.ts
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear session cookie
    cookieStore.set('vc_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediately expires the cookie
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada con éxito.'
    });

  } catch (error) {
    console.error('Logout Endpoint Error:', error);
    return NextResponse.json(
      { error: 'Fallo al cerrar sesión en el servidor.' },
      { status: 500 }
    );
  }
}
