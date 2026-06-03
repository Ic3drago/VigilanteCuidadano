'use client';

/**
 * VigilanteCiudadano - PortalCiudadano Page (Citizen View)
 * Location: app/ciudadano/page.tsx
 * Role: Principal Software Architect & Full-Stack Frontend Developer
 */

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, HelpCircle } from 'lucide-react';
import TerminalChat from '../../components/TerminalChat';
import Header from '../../components/Header';

export default function PortalCiudadano() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none pb-16 relative overflow-hidden">
      
      {/* Decorative City Grid SVG overlay */}
      <svg className="absolute inset-0 w-full h-full text-slate-500 opacity-[0.04] pointer-events-none" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cityMapGridCitizen" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="12" width="40" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="68" y="12" width="40" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cityMapGridCitizen)" />
      </svg>

      {/* Global Navigation Header */}
      <Header />

      {/* Workspace Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 flex flex-col gap-6 relative z-10">
        
        {/* Title bar */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            👤 Portal de Auxilio y Encriptación Ciudadana
          </h2>
          <p className="text-[11px] text-slate-500 uppercase font-mono mt-0.5 tracking-wider">
            Canal descentralizado y anónimo de comunicación directa BOL-110
          </p>
        </div>

        {/* Grid split */}
        <div className="flex flex-col lg:flex-row gap-6 justify-center items-stretch">
          
          {/* LEFT: Didactic cibersecurity guide cards */}
          <div className="w-full lg:w-80 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 shadow-sm text-slate-600 text-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4.5 h-4.5 text-[#1e3a8a]" />
              <span>Garantías Ciudadanas</span>
            </h3>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  Cifrado AES-GCM-256
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Tu reporte se encripta en el navegador antes de ser transmitido. Ninguna base de datos o administrador tiene acceso a leer tu texto plano.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  Clave Derivada PBKDF2
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Al configurar tu contraseña, derivamos una CryptoKey única mediante 100,000 iteraciones. Mantén tu contraseña a salvo, pues no se almacena en internet.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  👤 Auditoría Anónima
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Generamos un identificador virtual para auditar el auxilio policial sin vincularlo a tu cédula de identidad u otros datos comprometedores.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Conversational Chat portal */}
          <div className="flex-1 flex justify-center">
            <TerminalChat />
          </div>

        </div>

      </main>

    </div>
  );
}
